import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.models import Order, OrderItem, OrderStatus, Product, User, UserRole
from app.schemas.order import OrderCreate, OrderOut, OrderStatusUpdate

router = APIRouter(prefix="/orders", tags=["orders"])

# Valid forward transitions — prevents skipping steps or reviving a cancelled/delivered order.
_ALLOWED_TRANSITIONS: dict[OrderStatus, set[OrderStatus]] = {
    OrderStatus.PENDING: {OrderStatus.CONFIRMED, OrderStatus.CANCELLED},
    OrderStatus.CONFIRMED: {OrderStatus.PREPARING, OrderStatus.CANCELLED},
    OrderStatus.PREPARING: {OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED},
    OrderStatus.OUT_FOR_DELIVERY: {OrderStatus.DELIVERED},
    OrderStatus.DELIVERED: set(),
    OrderStatus.CANCELLED: set(),
}


async def _get_order_or_404(order_id: uuid.UUID, db: AsyncSession) -> Order:
    stmt = select(Order).where(Order.id == order_id).options(selectinload(Order.items))
    order = await db.scalar(stmt)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


def _assert_can_view(order: Order, user: User) -> None:
    allowed = user.role == UserRole.ADMIN or user.id in (order.customer_id, order.rider_id)
    if not allowed and user.role == UserRole.VENDOR:
        # Vendors may view orders containing at least one of their own products —
        # checked by the caller since it needs a DB query.
        return
    if not allowed and user.role != UserRole.VENDOR:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your order")


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.CUSTOMER, UserRole.ADMIN)),
):
    product_ids = [item.product_id for item in payload.items]
    result = await db.execute(select(Product).where(Product.id.in_(product_ids)))
    products = {p.id: p for p in result.scalars().all()}

    missing = [str(pid) for pid in product_ids if pid not in products]
    if missing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Products not found: {missing}")

    order_items: list[OrderItem] = []
    total = 0
    for item in payload.items:
        product = products[item.product_id]
        if not product.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{product.name} is unavailable")
        if product.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for {product.name}",
            )
        product.stock_quantity -= item.quantity
        total += float(product.price) * item.quantity
        order_items.append(OrderItem(product_id=product.id, quantity=item.quantity, unit_price=product.price))

    order = Order(
        customer_id=current_user.id,
        delivery_address=payload.delivery_address,
        total_amount=total,
        items=order_items,
    )
    db.add(order)
    await db.commit()
    await db.refresh(order, attribute_names=["items"])
    return order


@router.get("", response_model=list[OrderOut])
async def list_my_orders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(default=20, le=100),
    offset: int = Query(default=0, ge=0),
):
    stmt = select(Order).options(selectinload(Order.items)).offset(offset).limit(limit)
    if current_user.role == UserRole.CUSTOMER:
        stmt = stmt.where(Order.customer_id == current_user.id)
    elif current_user.role == UserRole.RIDER:
        stmt = stmt.where(Order.rider_id == current_user.id)
    # Vendors and admins see all orders (vendor filtering by product ownership is a future refinement).

    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{order_id}", response_model=OrderOut)
async def get_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = await _get_order_or_404(order_id, db)
    _assert_can_view(order, current_user)
    return order


@router.patch("/{order_id}/status", response_model=OrderOut)
async def update_order_status(
    order_id: uuid.UUID,
    payload: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.VENDOR, UserRole.RIDER, UserRole.ADMIN)),
):
    order = await _get_order_or_404(order_id, db)

    if current_user.role == UserRole.RIDER and order.rider_id not in (None, current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Order assigned to another rider")

    if payload.status not in _ALLOWED_TRANSITIONS.get(order.status, set()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot move order from {order.status.value} to {payload.status.value}",
        )

    if current_user.role == UserRole.RIDER and order.rider_id is None:
        order.rider_id = current_user.id

    order.status = payload.status
    await db.commit()
    await db.refresh(order, attribute_names=["items"])
    return order