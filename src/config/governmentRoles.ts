
export type GovernmentDepartment =
    | 'The National Treasury'
    | 'NCA'
    | 'County Government'
    | 'EACC'
    | 'Ministry of Infrastructure'
    | 'Auditor General'
    | 'Pending Assignment';

export interface DepartmentPermission {
    department: GovernmentDepartment;
    allowedRoutes: string[]; // List of protected dashboard paths
    primaryFocus: string;
}

export const GOVERNMENT_DEPARTMENTS: DepartmentPermission[] = [
    {
        department: 'The National Treasury',
        allowedRoutes: ['/government/escrow-funding', '/government/lpo', '/government/analytics'],
        primaryFocus: 'Exchequer Funding & Budgeting'
    },
    {
        department: 'NCA',
        allowedRoutes: ['/government/milestones', '/government/verification', '/government/contractors'],
        primaryFocus: 'Technical Standards & Quality Assurance'
    },
    {
        department: 'County Government',
        allowedRoutes: ['/government/projects', '/government/payment-release', '/government/reports'],
        primaryFocus: 'Project Implementation & Disbursement'
    },
    {
        department: 'EACC',
        allowedRoutes: ['/government/blockchain', '/government/payments', '/government/compliance'],
        primaryFocus: 'Oversight & Investigation'
    },
    {
        department: 'Auditor General',
        allowedRoutes: ['/government/blockchain', '/government/payments', '/government/reports'],
        primaryFocus: 'Financial Auditing'
    },
    {
        department: 'Ministry of Infrastructure',
        allowedRoutes: ['/government/projects', '/government/milestones', '/government/bid-approval'],
        primaryFocus: 'Policy & Infrastructure Planning'
    }
];

/**
 * Checks if a department has access to a specific route.
 * Returns false if the department is not found or route is not allowed.
 */
export const isRouteAllowed = (department: string, route: string): boolean => {
    // Common routes allowed for everyone (e.g. main dashboard, portfolio, profile)
    const commonRoutes = ['/government', '/government/portfolio', '/government/profile', '/visuals'];
    if (commonRoutes.some(r => route === r || route.startsWith(r + '/'))) return true;

    const deptLower = department.toLowerCase();
    const found = GOVERNMENT_DEPARTMENTS.find(d => d.department.toLowerCase() === deptLower);

    if (!found) return false;

    // Check if any allowed route matches the beginning of the target route
    return found.allowedRoutes.some(allowed => route.startsWith(allowed));
};
