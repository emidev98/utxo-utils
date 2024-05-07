
import { listOutline, listSharp, archiveOutline, archiveSharp, cogOutline, cogSharp, pieChartOutline, pieChartSharp, alarmOutline, alarmSharp, walletOutline, walletSharp } from 'ionicons/icons';
import { useLocation } from 'react-router';
import ArchivePage from '../pages/archive/Archive';
import AlertsPage from '../pages/alerts/Alerts';
import DashboardPage from '../pages/dashboard/Dashboard';
import ListPage from '../pages/list/List';
import SettingsPage from '../pages/settings/Settings';
import WalletsPage from '../pages/wallets/Wallets';

export interface Page {
    url: string;
    iosIcon: string;
    mdIcon: string;
    title: string;
    component: React.ReactNode;
}

export const usePages = () => {
    const { pathname } = useLocation();

    const pages: Page[] = [
        {
            title: 'Dashboard',
            url: '/dashboard',
            iosIcon: pieChartOutline,
            mdIcon: pieChartSharp,
            component: <DashboardPage />
        },
        {
            title: 'Wallets',
            url: '/wallets',
            iosIcon: walletOutline,
            mdIcon: walletSharp,
            component: <WalletsPage />
        },
        {
            title: 'List',
            url: '/list',
            iosIcon: listOutline,
            mdIcon: listSharp,
            component: <ListPage />
        },
        {
            title: 'Alerts',
            url: '/alerts',
            iosIcon: alarmOutline,
            mdIcon: alarmSharp,
            component: <AlertsPage/>
        },
        {
            title: 'Archived',
            url: '/archived',
            iosIcon: archiveOutline,
            mdIcon: archiveSharp,
            component: <ArchivePage/>,
        },
        {
            title: 'Settings',
            url: '/settings',
            iosIcon: cogOutline,
            mdIcon: cogSharp,
            component: <SettingsPage/>
        }
    ];

    const getCurrentPage = () => {
        const page = pages.find(menuEntry => menuEntry.url === pathname);

        if (!page) {
            return pages[0];
        }

        return page;
    }

    return { pages, getCurrentPage }
}

