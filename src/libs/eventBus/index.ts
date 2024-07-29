import mitt from 'mitt';
import type { Events } from './events';

export const EventBus = mitt<Events>();
