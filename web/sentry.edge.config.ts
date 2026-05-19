import * as Sentry from '@sentry/nextjs';
import { getBaseSentryOptions } from './sentry.shared';

Sentry.init(getBaseSentryOptions());
