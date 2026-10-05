
const AuthenticationConfiguration = {
    usernameSelector: '#username',
    passwordSelector: '#password',
    submitSelector: 'input[data-dsp-i18n="commons.action.logIn"]',
    successUrl: '/3dpassport/admin-tools/v2',
    errorSelector: '.error-messages',
    // Some accounts land here instead of successUrl after a valid login -
    // a "complete your profile" panel, not a failure. Keyed off the i18n
    // translation key on its heading, since that's the most specific stable
    // anchor in the panel's markup.
    profileCompletionSelector: 'h3[data-dsp-i18n="3dxp.profile.title"]',
}

export default AuthenticationConfiguration;