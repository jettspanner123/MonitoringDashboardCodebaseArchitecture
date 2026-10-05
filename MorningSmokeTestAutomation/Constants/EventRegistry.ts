
const EventRegistry = {
    PING: {
        AUTHENTICATION_PAGE: "AUTHENTICATION_PAGE",
    },
    FILL_INPUT: {
        AUTHENTICATION_PAGE_PASSWORD_INPUT: "AUTHENTICATION_PAGE_PASSWORD_INPUT",
        AUTHENTICATION_PAGE_USERNAME_INPUT: "AUTHENTICATION_PAGE_USERNAME_INPUT",
    }
} as const;

export type EventRegistryType = (typeof EventRegistry)[keyof typeof EventRegistry][
    keyof (typeof EventRegistry)[keyof typeof EventRegistry]
    ];

export default EventRegistry;