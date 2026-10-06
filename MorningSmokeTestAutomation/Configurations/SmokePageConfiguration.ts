import SmokePageTypeInterface from "../Types/SmokePageTypeInterface";
import SmokeEnvironmentNameType from "../Types/SmokeEnvironmentNameType";
import EnvironmentConfiguration from "./EnvironmentConfiguration";

export default class SmokePageConfigurationService {
    public static current = new SmokePageConfigurationService();

    private static readonly EXTRA_CHECK_TIMEOUT_MS = 60000;
    private static readonly QUEUE_STATUS_TIMEOUT_MS = 150000; // 2.5 minutes
    private static readonly POPUP_CHECK_TIMEOUT_MS = 120000; // 2 minutes

    public getSmokePageConfiguration(environment: SmokeEnvironmentNameType): Array<SmokePageTypeInterface> {
        const envConfig = EnvironmentConfiguration.ALL[environment];

        const commonPages: Array<SmokePageTypeInterface> = [
            {
                name: '3DSpace search',
                url: envConfig.spaceUrl,
                recordPageLoadCheck: true,
                searchInputSelector: 'input.sn-search-field',
                searchTerm: 'prd',
                searchButtonSelector: '[data-rec-id="run_btn_search"]',
                expectedResultSelector: '#search-nb-result',
                minResultCount: 0,
                hoverInfoSelector: '[data-rec-id="SNResultMgt_wux-ui-3ds_wux-ui-3ds-1x_wux-ui-3ds-help"]',
                hoverTooltipSelector: '.maximumResultsTooltip',
                recordIndexingFreshnessCheck: true,
                postResultsClickSelector: '#compass_ctn',
                timeoutMs: SmokePageConfigurationService.POPUP_CHECK_TIMEOUT_MS,
                popupChecks: [
                    { name: '3DDashboard', menuItemSelector: '[data-search="3DDashboard"]' },
                    { name: '3DSwym', menuItemSelector: '[data-search="3DSwym"]', expectedElementSelector: '#communities-tab' },
                    {
                        name: 'AtlasWidget1',
                        compassSearchIconSelector: '.compass-nav-search-icon',
                        compassSearchInputSelector: '.input-group input.compass-search-text',
                        compassSearchTerm: 'atlas',
                        menuItemSelector: '[data-id="MAP-BWQLMZTMX"]',
                        expectedElementSelector: '.close-icon.fonticon-cancel',
                    },
                    {
                        name: 'AtlasWidget2',
                        menuItemSelector: '[data-id="MAP-HUFLWVWPC"]',
                        expectedElementSelector: '.close-icon.fonticon-cancel',
                        closePopupAfterCheck: true,
                    },
                    {
                        name: 'AtlasWidget3',
                        menuItemSelector: '[data-id="MAP-APEPFZXTT"]',
                        expectedElementSelector: '.close-icon.fonticon-cancel',
                        closePopupAfterCheck: true,
                    },
                    {
                        name: 'AtlasWidget4',
                        menuItemSelector: '[data-id="MAP-EYBLVBWUR"]',
                        expectedElementSelector: '.close-icon.fonticon-cancel',
                        closePopupAfterCheck: true,
                    },
                ],
            },
            {
                name: 'XPDMGW Queue Status',
                url: envConfig.xpdmgwUrl,
                recordPageLoadCheck: true,
                expectedResultSelector: '#q_table td.left_align',
                expectedCount: 7,
                recordQueueStatusCheck: true,
                queueStatusTableSelector: '#q_table',
                timeoutMs: SmokePageConfigurationService.QUEUE_STATUS_TIMEOUT_MS,
            },
            {
                name: '3DEXPERIENCE Platform GW Queue Status',
                url: envConfig.platformGwUrl,
                recordPageLoadCheck: true,
                expectedResultSelector: '#q_table td.left_align',
                expectedCount: 5,
                recordQueueStatusCheck: true,
                queueStatusTableSelector: '#q_table',
                timeoutMs: SmokePageConfigurationService.QUEUE_STATUS_TIMEOUT_MS,
            },
        ];

        const extraPages: Array<SmokePageTypeInterface> = envConfig.extraChecks.map((check) => {
            if (check.kind === 'page-load-only') {
                return {
                    name: check.name,
                    url: check.url,
                    recordPageLoadCheck: true,
                    timeoutMs: SmokePageConfigurationService.EXTRA_CHECK_TIMEOUT_MS,
                };
            }

            return {
                name: check.name,
                url: check.url,
                recordPageLoadCheck: true,
                expectedResultSelector: check.selector,
                timeoutMs: SmokePageConfigurationService.EXTRA_CHECK_TIMEOUT_MS,
            };
        });

        return [...commonPages, ...extraPages];
    }
}
