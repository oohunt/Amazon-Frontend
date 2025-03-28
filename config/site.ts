export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "OOHUNT",
  description: "Amazon Deals Display Platform",
  navItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "All Products",
      href: "/products",
    },
    {
      label: "Limited Time Deals",
      href: "/deals",
    },
    {
      label: "My Favorites",
      href: "/favorites",
    },
    {
      label: "About Us",
      href: "/about",
    },
  ],
  navMenuItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "All Products",
      href: "/products",
    },
    {
      label: "Limited Time Deals",
      href: "/deals",
    },
    {
      label: "My Favorites",
      href: "/favorites",
    },
    {
      label: "About Us",
      href: "/about",
    },
  ],
  links: {
    github: "https://github.com/your-username/amazon-deals",
    twitter: "https://twitter.com/your-username",
    docs: "https://your-docs-site.com",
    discord: "https://discord.gg/your-server",
  },
};
