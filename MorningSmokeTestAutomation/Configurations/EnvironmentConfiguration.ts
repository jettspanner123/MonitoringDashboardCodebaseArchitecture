import SmokeEnvironmentNameType from "../Types/SmokeEnvironmentNameType";
import SmokeExtraCheckConfigInterface from "../Types/SmokeExtraCheckConfigInterface";

export interface EnvironmentConfigInterface {
    // Full login page URL for this environment's 3DPassport - navigated to
    // directly (not composed from a shared relative path), since the login
    // path itself differs between environments (some are
    // /3dpassport/login, others /3dpassport/admin-tools/v2/login).
    authUrl: string;
    spaceUrl: string;
    xpdmgwUrl: string;
    platformGwUrl: string;
    // FCS / Admin Controlls / JRDS / NOCAS - varies per environment, both in
    // which ones exist and how many (e.g. Production has two FCS instances,
    // QA has three, Training/Dev1 have one, Testing/Dev2 have none).
    extraChecks: SmokeExtraCheckConfigInterface[];
}

export default class EnvironmentConfiguration {
    // Transcribed from Configurations/MorningMonitoringLinksAndENV.xml, with
    // two kinds of values deliberately dropped rather than copied verbatim:
    //   - ;jsessionid=... suffixes - these are live browser session ids
    //     captured off an already-logged-in tab; they're meaningless (and
    //     likely expired) by the time Playwright opens its own fresh,
    //     unauthenticated session.
    //   - Production's 3DSpace URL had a `?ticket=ST-...&collabSpace=Default`
    //     query string - a CAS single-use service ticket, even more ephemeral
    //     than a jsessionid (it's consumed on first use). Normalized to the
    //     bare /3dspace path, matching every other environment.
    public static readonly ALL: Record<SmokeEnvironmentNameType, EnvironmentConfigInterface> = {
    Training: {
        authUrl: 'https://air3dpassporttrn24x.atlascopco.group/3dpassport/login',
        spaceUrl: 'https://air3dspacetrn24x.atlascopco.group/3dspace',
        xpdmgwUrl: 'http://air3dxpdmgwtrnsrv.atlascopco.group:8050/XPDMGW/',
        platformGwUrl: 'http://air3dgwtrnsrv.atlascopco.group:8040/3DEXPERIENCEPlatformGW/',
        extraChecks: [
            { name: 'FCS Server', url: 'https://air3dfcstrn24x.atlascopco.group/fcs/servlet/fcs/about', kind: 'page-load-only' },
        ],
    },
    Production: {
        authUrl: 'https://air3dxpassport.atlascopco.group/3dpassport/admin-tools/v2/login',
        spaceUrl: 'https://air3dxspace.atlascopco.group/3dspace',
        xpdmgwUrl: 'http://air3dxgw1srv.atlascopco.group:8050/XPDMGW/',
        platformGwUrl: 'http://air3dxxpdmgw1srv.atlascopco.group:8040/3DEXPERIENCEPlatformGW/',
        extraChecks: [
            { name: 'Admin Controlls', url: 'http://air3dxspaceidxmtr.atlascopco.group:19001/admin/', kind: 'selector-wait', selector: '.login-form' },
            { name: 'JRDS', url: 'http://air3dxspaceidxmtr.atlascopco.group:19001/monitoring-ui/', kind: 'selector-wait', selector: '#treePane' },
            { name: 'NOCAS', url: 'https://air3dxspacenocas.atlascopco.group/internal/', kind: 'selector-wait', selector: '#loginForm' },
            { name: 'FCS-1', url: 'https://air3dxfcswuxi.atlascopco.group/fcs/servlet/fcs/about', kind: 'page-load-only' },
            { name: 'FCS-2', url: 'https://air3dfcsgecia.atlascopco.group/fcs/servlet/fcs/about', kind: 'page-load-only' },
        ],
    },
    QA: {
        authUrl: 'https://air3dpassportqa.atlascopco.group/3dpassport/admin-tools/v2/login',
        spaceUrl: 'https://air3dspaceqa.atlascopco.group/3dspace',
        xpdmgwUrl: 'http://air3dgw1qasrv.atlascopco.group:8050/XPDMGW/',
        platformGwUrl: 'http://air3dxpdmgw1qasrv.atlascopco.group:8040/3DEXPERIENCEPlatformGW/',
        extraChecks: [
            { name: 'Admin Controlls', url: 'http://aiasnlas0054.atlascopco.group:19001/admin/#home', kind: 'selector-wait', selector: '.login-form' },
            { name: 'NOCAS', url: 'https://air3dspacenocasqa.atlascopco.group/internal/', kind: 'selector-wait', selector: '#loginForm' },
            { name: 'FCS-Huston', url: 'https://air3dfcshoustonqa.atlascopco.group/fcs/servlet/fcs/about', kind: 'page-load-only' },
            { name: 'FCS-Gecia', url: 'https://air3dfcsgeciaqa.atlascopco.group/fcs/servlet/fcs/about', kind: 'page-load-only' },
            { name: 'FCS-3', url: 'https://air3dfcswuxiqa.atlascopco.group/fcs/servlet/fcs/about', kind: 'page-load-only' },
        ],
    },
    Dev1: {
        authUrl: 'https://air3dpassportdev124x.atlascopco.group/3dpassport/login',
        spaceUrl: 'https://air3dspacedev124x.atlascopco.group/3dspace',
        xpdmgwUrl: 'http://air3dxpdmgwdev124x.atlascopco.group:8050/XPDMGW/',
        platformGwUrl: 'http://air3dxgwdev124x.atlascopco.group:8040/3DEXPERIENCEPlatformGW/',
        extraChecks: [
            { name: 'NOCAS', url: 'https://air3dspacenocasdev124x.atlascopco.group/internal/common/emxSecurityContextSelection.jsp', kind: 'selector-wait', selector: '#loginForm' },
            { name: 'FCS', url: 'https://air3dfcsdev124x.atlascopco.group/fcs/servlet/fcs/about', kind: 'page-load-only' },
        ],
    },
    // NOTE: unlike every other environment, this auth URL has no /login
    // suffix - it may already be the post-login admin-tools landing page
    // rather than the login form itself (possibly copied from an
    // already-authenticated browser tab, the same way the jsessionids
    // were). Worth double-checking against the real environment.
    Testing: {
        authUrl: 'https://air3dpassporttst24x.atlascopco.group/3dpassport/admin-tools/v2',
        spaceUrl: 'https://air3dspacetst24x.atlascopco.group/3dspace',
        xpdmgwUrl: 'http://air3dgwtstsrv.atlascopco.group:8050/XPDMGW/',
        platformGwUrl: 'http://air3dgwtstsrv.atlascopco.group:8040/3DEXPERIENCEPlatformGW/',
        extraChecks: [
            { name: 'NOCAS', url: 'http://air3dspacenocastst24x.atlascopco.group/internal/emxLogin.jsp', kind: 'selector-wait', selector: '#loginForm' },
            { name: 'Admin Controlls', url: 'http://air3dspaceidxtstsrv.atlascopco.group:19001/admin/#home', kind: 'selector-wait', selector: '.login-form' },
        ],
    },
    Dev2: {
        authUrl: 'https://air3dpassportdev2.atlascopco.group/3dpassport/login',
        spaceUrl: 'https://air3dspacedev2.atlascopco.group/3dspace',
        xpdmgwUrl: 'http://air3dspacedev224x.atlascopco.group:8050/XPDMGW/',
        platformGwUrl: 'http://air3dspacedev224x.atlascopco.group:8040/3DEXPERIENCEPlatformGW/',
        extraChecks: [
            { name: 'NOCAS', url: 'https://air3dspacenocasdev2.atlascopco.group/internal', kind: 'selector-wait', selector: '#loginForm' },
        ],
    },
    };
}
