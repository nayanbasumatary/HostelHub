
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { useCart } from "@/lib/hooks/useCart";
import { useUser } from "@/lib/hooks/useUser";
import { formatCurrency } from "@/lib/utils/formatters";
import { COD_MAX, deliverySplit } from "@/lib/utils/orderHelpers";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import type { PaymentMethod, SettingsMap, Profile } from "@/lib/types";
import { useSettings } from "@/lib/hooks/useSettings";

export function CheckoutView({
  settings,
  initialProfile,
  walletBalance = 0,
}: {
  settings: SettingsMap;
  initialProfile: Profile | null;
  walletBalance?: number;
}) {
  const { isAuthenticated, loading: userLoading, user } = useUser();
  const hydrated = useCart((s) => s.hydrated);
  const items = useCart((s) => s.items);
  const orderType = useCart((s) => s.orderType);
  const clear = useCart((s) => s.clear);

  const currency = settings.currency_symbol ?? "₹";
  const shopOpen = settings.shop_is_open !== "false";
  const { isOpen } = useSettings();
  const deliveryFee = Number(settings.delivery_fee ?? 10);

  const [form, setForm] = useState({
    customer_name: initialProfile?.full_name || user?.name || "",
    customer_phone: initialProfile?.phone || "",
    customer_room: initialProfile?.hostel_block || "",
    payment_method: "cash" as PaymentMethod,
    notes: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState<{
    id: string;
    order_number: string;
    total: number;
    otp_code?: string;
  } | null>(null);

  useEffect(() => {
    if (user?.name && !form.customer_name) {
      setForm((f) => ({ ...f, customer_name: user.name as string }));
    }
  }, [user?.name]);

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      let val = e.target.value;
      if (k === "customer_phone") {
        val = val.replace(/\D/g, "").slice(0, 10);
      }
      setForm((f) => ({ ...f, [k]: val }));
    };

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const isDelivery = orderType === "delivery";
  const fee = deliverySplit(settings, orderType, subtotal).delivery_fee;
  const freeDelivery = isDelivery && fee === 0 && deliveryFee > 0;
  const total = subtotal + fee;
  const mustUseUpi = isDelivery && total > COD_MAX;
  const pickupAddress = settings.shop_address?.trim();
  const walletCovers = walletBalance >= total && total > 0;
  const payWithWallet = form.payment_method === "credit";

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();

    const liveOpen = typeof isOpen === "boolean" ? isOpen : shopOpen;

    if (!liveOpen) return toast.error("The shop is currently closed.");
    if (payWithWallet && !walletCovers) {
      return toast.error("Not enough wallet credit for this order.");
    }
    if (isDelivery && !form.customer_room) {
      return toast.error("Please select your hostel.");
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            product_id: i.id,
            quantity: i.quantity,
          })),
          order_type: orderType,
          customer_name: form.customer_name,
          customer_phone: form.customer_phone,
          customer_room: form.customer_room,
          payment_method: payWithWallet
            ? "credit"
            : orderType === "delivery"
              ? mustUseUpi
                ? "upi"
                : "cash"
              : form.payment_method,
          notes: form.notes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        return toast.error(data.error ?? "Could not place order.");
      }

      clear();

      setPlaced({
        id: data.order.id,
        order_number: data.order.order_number,
        total: data.order.total_amount,
        otp_code: data.order.otp_code,
      });
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!hydrated) {
    return <div className="p-10 text-center text-stone-400">Loading...</div>;
  }

  if (placed) {
    return (
      <div className="mx-auto max-w-md px-4 py-14">
        <div className="glass flex flex-col items-center rounded-3xl px-6 py-12 text-center">
          <div className="relative mb-5 grid h-24 w-24 place-items-center">
            <span className="absolute inset-0 rounded-full bg-green-500/30 animate-ring" />
            <span className="absolute inset-0 rounded-full bg-green-500/20 animate-ring [animation-delay:.4s]" />
            <span className="animate-pop-in grid h-20 w-20 place-items-center rounded-full bg-green-500 text-white shadow-lg shadow-green-500/30">
              <CheckCircle2 className="h-11 w-11" strokeWidth={2.5} />
            </span>
          </div>

          <h1 className="text-2xl font-extrabold text-stone-900 dark:text-white">
            Order placed! 🎉
          </h1>

          <p className="mt-2 text-stone-600 dark:text-stone-300">
            Order{" "}
            <span className="font-bold text-stone-900 dark:text-white">
              {placed.order_number}
            </span>{" "}
            · {formatCurrency(placed.total, currency)}
          </p>

          <div className="mt-4 rounded-2xl bg-yellow-400/15 px-4 py-3 text-sm font-medium text-stone-700 dark:text-stone-200">
            ⏳ Your order will be accepted soon.
            {orderType === "delivery"
              ? " Your parcel will be delivered to your hostel gate or security desk. You can track its status on your orders page."
              : " You can track the status anytime on your orders page."}
          </div>

          {placed.otp_code && (
            <div className="mt-4 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-4 text-sm text-yellow-900">
              <p className="font-semibold">Your 4-digit order OTP</p>
              <p className="mt-2 text-2xl tracking-[0.5em] font-bold">
                {placed.otp_code}
              </p>
              <p className="mt-1 text-xs text-yellow-700">
                Share this code with the delivery partner or pickup admin when they arrive.
              </p>
            </div>
          )}

          <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full">
                Back to shop
              </Button>
            </Link>
            <Link href={`/orders/${placed.id}`} className="w-full sm:w-auto">
              <Button className="w-full">Track order</Button>
            </Link>
          </div>

          <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">
            Your order is saved. You can track it whenever you're ready.
          </p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-24 text-center text-stone-500 dark:text-stone-400">
        Your cart is empty.{" "}
        <Link
          href="/"
          className="font-semibold text-lime-700 hover:underline dark:text-lime-300"
        >
          Go shopping
        </Link>
      </div>
    );
  }

  if (!isAuthenticated && !userLoading) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-xl font-extrabold text-stone-950 dark:text-white">
          Sign in to order
        </h1>
        <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
          Orders require an account so we can contact you about your order.
        </p>
        <div className="mt-6 flex justify-center">
          <Link href="/login?redirect=/checkout">
            <Button size="lg">Sign in</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-5">
      <h1 className="mb-4 text-xl font-extrabold text-stone-950 dark:text-white">
        Checkout
      </h1>

      <form onSubmit={placeOrder} className="space-y-5">
        <div className="rounded-lg border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-stone-900">
          <p className="mb-3 text-sm font-semibold text-stone-700 dark:text-stone-300">
            {isDelivery ? "Hostel Gate Delivery Details" : "Pickup details"}
          </p>

          {!isDelivery && pickupAddress && (
            <div className="mb-3 rounded-lg border border-lime-500/60 bg-lime-50 px-3 py-2 text-sm text-stone-700 dark:bg-lime-400/10 dark:text-stone-200">
              <span className="font-semibold">Collect from:</span>{" "}
              {pickupAddress}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                required
                value={form.customer_name}
                onChange={set("customer_name")}
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.customer_phone}
                onChange={set("customer_phone")}
                inputMode="numeric"
              />
            </div>

            {isDelivery && (
              <div>
                <Label htmlFor="checkout-hostel">Select your hostel</Label>
                <select
                  id="checkout-hostel"
                  required
                  value={form.customer_room}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      customer_room: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-stone-900 dark:border-white/10 dark:bg-stone-800 dark:text-white"
                >
                  <option value="">Choose your hostel</option>
                  <option value="Stephen Hall">Stephen Hall</option>
                  <option value="Vulmawi">Vulmawi</option>
                </select>

                <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                  Your parcel will be delivered to the hostel gate or security desk. Room delivery is not available.
                </p>
              </div>
            )}

            <div>
              <Label>Payment method</Label>
              <div className="space-y-2">
                {walletBalance > 0 && (
                  <button
                    type="button"
                    disabled={!walletCovers}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        payment_method: payWithWallet ? "cash" : "credit",
                      }))
                    }
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60 ${
                      payWithWallet
                        ? "border-lime-500 bg-lime-50 text-lime-800 dark:bg-lime-400/10 dark:text-lime-300"
                        : "border-black/10 text-stone-700 dark:border-white/10 dark:text-stone-200"
                    }`}
                  >
                    Pay with wallet
                    <span className="mt-0.5 block text-xs font-normal text-stone-500 dark:text-stone-400">
                      Balance {formatCurrency(walletBalance, currency)}
                      {!walletCovers && " — not enough to cover this order"}
                    </span>
                  </button>
                )}

                {!payWithWallet &&
                  (isDelivery ? (
                    mustUseUpi ? (
                      <div className="rounded-lg border border-lime-500 bg-lime-50 px-3 py-2 text-sm font-medium text-lime-800 dark:bg-lime-400/10 dark:text-lime-300">
                        UPI at the hostel gate (required)
                        <span className="mt-0.5 block text-xs font-normal text-lime-700/80 dark:text-lime-300/70">
                          Orders over {formatCurrency(COD_MAX, currency)}{" "}
                          can&apos;t be cash on delivery. Pay using the shop QR shown by the delivery partner.
                        </span>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-black/10 px-3 py-2 text-sm font-medium text-stone-700 dark:border-white/10 dark:text-stone-200">
                        Cash on delivery
                        <span className="mt-0.5 block text-xs font-normal text-stone-500 dark:text-stone-400">
                          Prefer UPI? Pay at the hostel gate using the shop QR.
                        </span>
                      </div>
                    )
                  ) : (
                    <div className="flex gap-3">
                      {(["cash", "upi"] as PaymentMethod[]).map((m) => (
                        <button
                          type="button"
                          key={m}
                          onClick={() =>
                            setForm((f) => ({ ...f, payment_method: m }))
                          }
                          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize ${
                            form.payment_method === m
                              ? "border-lime-500 bg-lime-50 text-lime-800 dark:bg-lime-400/10 dark:text-lime-300"
                              : "border-black/10 text-stone-600 dark:border-white/10 dark:text-stone-300"
                          }`}
                        >
                          {m === "cash" ? "Cash" : "UPI"}
                        </button>
                      ))}
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={set("notes")}
                rows={2}
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-stone-900">
          <p className="mb-2 text-sm font-semibold text-stone-700 dark:text-stone-300">
            Order summary
          </p>

          {items.map((i) => (
            <div
              key={i.id}
              className="num-row py-0.5 text-sm text-stone-600 dark:text-stone-400"
            >
              <span>
                {i.name} × {i.quantity}
              </span>
              <span>{formatCurrency(i.price * i.quantity, currency)}</span>
            </div>
          ))}

          <div className="num-row mt-2 border-t border-black/10 pt-2 text-sm text-stone-600 dark:border-white/10 dark:text-stone-400">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal, currency)}</span>
          </div>

          {orderType === "delivery" && (
            <div className="num-row text-sm text-stone-600 dark:text-stone-400">
              <span>Delivery fee</span>
              {freeDelivery ? (
                <span className="font-semibold text-lime-600 dark:text-lime-400">
                  <s className="mr-1.5 font-normal text-stone-400 dark:text-stone-500">
                    {formatCurrency(deliveryFee, currency)}
                  </s>
                  FREE
                </span>
              ) : (
                <span>{formatCurrency(fee, currency)}</span>
              )}
            </div>
          )}

          <div className="num-row mt-2 border-t border-black/10 pt-2 text-base font-extrabold text-stone-950 dark:border-white/10 dark:text-white">
            <span>Total</span>
            <span>{formatCurrency(total, currency)}</span>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          loading={submitting}
          disabled={!(typeof isOpen === "boolean" ? isOpen : shopOpen)}
          className="w-full"
        >
          {(typeof isOpen === "boolean" ? isOpen : shopOpen)
            ? `Place order · ${formatCurrency(total, currency)}`
            : "Shop is closed"}
        </Button>
      </form>
    </div>
  );
}
