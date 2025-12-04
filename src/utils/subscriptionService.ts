import { useEffect, useState } from "react";
import { useEcho } from "utils/websocketConfig";

export const subscriptionEvents = {
    jobUpdated: { channel: "jobs", event: ".job.updated" },
    invoiceUpdated: { channel: "invoices", event: ".invoice.updated" },
};

type EventConfig = Record<
    string,
    {
        channel: string;
        event: string;
    }
>;

// Track global subscriptions to prevent duplicates
const globalSubscribed = new Map<string, boolean>();

export function useSubscriptionService(events: EventConfig) {
    const { echo, connected } = useEcho();
    const [data, setData] = useState<Record<string, any>>({});

    useEffect(() => {
        if (!connected || !echo) return;

        const unsubscribeFns: (() => void)[] = [];

        Object.entries(events).forEach(([key, { channel, event }]) => {
            const subKey = `${channel}:${event}`;

            // Skip if already subscribed globally
            if (globalSubscribed.get(subKey)) return;
            globalSubscribed.set(subKey, true);

            const ch = echo.channel(channel);

            const callback = (payload: any) => {
                setData(prev => ({ ...prev, [key]: payload }));
            };

            ch.listen(event, callback);
            unsubscribeFns.push(() => ch.stopListening(event, callback));
        });

        return () => unsubscribeFns.forEach(fn => fn());
    }, [connected, echo, events]);

    return data; // ✅ Only data
}
