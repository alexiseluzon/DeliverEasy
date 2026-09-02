import { render, screen } from "@testing-library/react";
import { OrderStatusTrack } from "@/components/OrderStatusTrack";

describe("OrderStatusTrack", () => {
  it("labels the current status for screen readers", () => {
    render(<OrderStatusTrack status="preparing" />);
    expect(screen.getByRole("img", { name: /Order status: Preparing/i })).toBeInTheDocument();
  });

  it("renders a distinct state for cancelled orders", () => {
    render(<OrderStatusTrack status="cancelled" />);
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
  });
});
