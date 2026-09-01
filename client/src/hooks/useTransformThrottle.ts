import { useRef, useCallback } from 'react';
import { getSocket } from '../services/socket';
import { TransformData } from '../types';

export function useTransformThrottle(sceneId: string, objectId: string) {
  const lastEmitTime = useRef<number>(0);
  const pendingTimeout = useRef<any>(null);
  const lastTransform = useRef<TransformData | null>(null);

  const emitContinuousTransform = useCallback(
    (transform: TransformData) => {
      lastTransform.current = transform;
      const now = performance.now();
      const throttleIntervalMs = 25; // ~40 updates/sec maximum network emission

      if (now - lastEmitTime.current >= throttleIntervalMs) {
        lastEmitTime.current = now;
        const socket = getSocket();
        if (socket.connected) {
          socket.emit('object:transform', {
            sceneId,
            objectId,
            transform,
            isContinuous: true,
          });
        }
      } else {
        // Buffer latest state to emit when timer fires
        if (!pendingTimeout.current) {
          pendingTimeout.current = setTimeout(() => {
            if (lastTransform.current) {
              const socket = getSocket();
              if (socket.connected) {
                socket.emit('object:transform', {
                  sceneId,
                  objectId,
                  transform: lastTransform.current,
                  isContinuous: true,
                });
              }
              lastEmitTime.current = performance.now();
            }
            pendingTimeout.current = null;
          }, throttleIntervalMs);
        }
      }
    },
    [sceneId, objectId]
  );

  const emitFinalTransform = useCallback(
    (transform: TransformData) => {
      if (pendingTimeout.current) {
        clearTimeout(pendingTimeout.current);
        pendingTimeout.current = null;
      }
      const socket = getSocket();
      if (socket.connected) {
        socket.emit('object:transform-end', {
          sceneId,
          objectId,
          transform,
        });
      }
    },
    [sceneId, objectId]
  );

  return { emitContinuousTransform, emitFinalTransform };
}
