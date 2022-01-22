import * as Sentry from "@sentry/browser";
import { Integrations } from "@sentry/tracing";

Sentry.init({
    dsn: "https://27924dd4619e40e9b623f8d0532b34a7@o282582.ingest.sentry.io/6161908",
    integrations: [new Integrations.BrowserTracing()],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
});

Sentry.addGlobalEventProcessor((event, _hint) => {
    if (event.level == 'error') {
        let message = event.exception?.values ? event.exception?.values[0].value : '';
        ui.notifications?.error(`Une erreur c'est produite. Voir la console [F12] pour plus d'informations: ${message}`);
    }
    return event;
})
