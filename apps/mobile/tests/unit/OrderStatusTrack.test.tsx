import { render, screen } from "@testing-library/react-native";
import { OrderStatusTrack } from "@/components/OrderStatusTrack";

describe("OrderStatusTrack", () => {
  it("exposes the current status to accessibility tools", () => {
    render(<OrderStatusTrack status="out_for_delivery" />);
    expect(screen.getByLabelText("Order status: Out for delivery")).toBeTruthy();
  });

  it("shows a distinct label for cancelled orders", () => {
    render(<OrderStatusTrack status="cancelled" />);
    expect(screen.getByText("Cancelled")).toBeTruthy();
  });
});
