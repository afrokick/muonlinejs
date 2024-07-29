import { useEffect, useRef } from 'react';
import type { Events } from '../libs/eventBus/events';
import { EventBus } from '../libs/eventBus';

export function useEventBus<TKey extends keyof Events>(evName: TKey, callback: (data: Events[TKey]) => any) {
  const callbackRef = useRef<null | any>();
  callbackRef.current = callback;

  useEffect(() => {
    const newCB = (...rest: any[]) => {
      callbackRef.current && callbackRef.current(...rest);
    };
    EventBus.on(evName, newCB);


    return () => {
      EventBus.off(evName, newCB);
    };
  }, [evName, callbackRef]);
}
