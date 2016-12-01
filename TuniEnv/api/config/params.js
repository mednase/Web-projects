module.exports = {
    secret: 'YouAreMyOnlySecret',
    server_email: 'tuni.env@gmail.com',
    sendgateApi: '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',
    'database': 'mongodb://localhost:27017/tuni_env', // temporary
    'server_url': 'http://localhost:3000', // temporary
    Facebook:{
        FACEBOOK_CONSUMER_KEY: '1507541465927100',
        FACEBOOK_CONSUMER_SECRET:'f275865ea5b31f80f4dd4e0c388fc6b0',
        FACEBOOK_CALLBACK_URL: "http://localhost:3000/api/auth/facebook/callback",
    },
    Google: {
        GOOGLE_CONSUMER_KEY:'437170049294-po9dq05daac4rvfgd6jd97g0o8lc0027.apps.googleusercontent.com',
        GOOGLE_CONSUMER_SECRET:'J_IXx0y8NSii1eNaTGsyWfO1',
        GOOGLE_CALLBACK_URL: "http://localhost:3000/api/auth/google/callback",
    },
    Twitter: {
        TWITTER_CONSUMER_KEY: 'YMEnEj8OhfpYUfgC0F5DnPcgZ',
        TWITTER_CONSUMER_SECRET: 'wzI5ufKBQFzB7QD04cohH3WMpsA0m5mo0GoZB9Z1XmkUvQ8E41',
        TWITTER_CALLBACK_URL: "http://127.0.0.1:3000/api/auth/twitter/callback",
    },
    itemsPerPage: 12
};