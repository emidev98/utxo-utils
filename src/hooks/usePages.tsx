
import { listOutline, listSharp, archiveOutline, archiveSharp, cogOutline, cogSharp, pieChartOutline, pieChartSharp, alarmOutline, alarmSharp } from 'ionicons/icons';
import Dashboard from '../pages/dashboard/Dashboard';
import List from '../pages/list/List';
import Settings from '../pages/settings/Settings';
import { useLocation } from 'react-router';

export interface Page {
    url: string;
    iosIcon: string;
    mdIcon: string;
    title: string;
    component: React.FC;
}

export const usePages = () => {
    const { pathname } = useLocation();

    const pages: Page[] = [
        {
            title: 'Dashboard',
            url: '/dashboard',
            iosIcon: pieChartOutline,
            mdIcon: pieChartSharp,
            component: Dashboard
        },
        {
            title: 'List',
            url: '/list',
            iosIcon: listOutline,
            mdIcon: listSharp,
            component: List
        },
        // {
        //     title: 'Alerts',
        //     url: '/alerts',
        //     iosIcon: alarmOutline,
        //     mdIcon: alarmSharp
        // },
        // {
        //     title: 'Archived',
        //     url: '/archived',
        //     iosIcon: archiveOutline,
        //     mdIcon: archiveSharp
        // },
        {
            title: 'Settings',
            url: '/settings',
            iosIcon: cogOutline,
            mdIcon: cogSharp,
            component: Settings
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

