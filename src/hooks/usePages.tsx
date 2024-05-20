
import { listOutline, listSharp, archiveOutline, archiveSharp, cogOutline, cogSharp, pieChartOutline, pieChartSharp, alarmOutline, alarmSharp, atCircleOutline, atCircleSharp, gitNetworkOutline, gitNetworkSharp } from 'ionicons/icons';
import { useLocation, useNavigate } from 'react-router';
import ArchivePage from '../pages/archive/Archive';
import AlertsPage from '../pages/alerts/Alerts';
import DashboardPage from '../pages/dashboard/Dashboard';
import UTXOsPage from '../pages/utxos/UTXOs';
import SettingsPage from '../pages/settings/Settings';
import AddressesPage from '../pages/addresses/Addresses';

export interface Page {
    url: string;
    iosIcon: string;
    className?: string;
    mdIcon: string;
    title: string;
    component: React.ReactNode;
}

export const usePages = () => {
    const { pathname } = useLocation();
    const navigate = useNavigate();

    const pages: Page[] = [
        {
            title: 'Dashboard',
            url: '/dashboard',
            iosIcon: pieChartOutline,
            mdIcon: pieChartSharp,
            component: <DashboardPage />
        },
        {
            title: 'Addresses',
            url: '/addresses',
            iosIcon: atCircleOutline,
            mdIcon: atCircleSharp,
            component: <AddressesPage />
        },
        {
            title: 'UTXOs',
            url: '/utxos',
            className: 'utxos-menu-entry',
            iosIcon: gitNetworkOutline,
            mdIcon: gitNetworkSharp,
            component: <UTXOsPage />
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

    const navigateToFirstPage = () => {
        const url = pages[0].url;
        navigate(url);
        
    }

    return { pages, getCurrentPage, navigateToFirstPage }
}

