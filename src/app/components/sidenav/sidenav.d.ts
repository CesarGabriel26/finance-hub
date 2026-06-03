export interface NavLink {
    icon: string;
    label: string;
    path: string;
}

export interface NavDropDown {
    icon: string;
    label: string;
    items: NavLink[];
}

export type NavItem = NavLink | NavDropDown;