import { publicOrigin } from "../lib/site-data";
import { JsonLd } from "./json-ld";

type BreadcrumbItem = {
  label: string;
  href: string;
};

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const completeItems = [{ label: "Home", href: "/" }, ...items];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: completeItems.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.label,
            item: `${publicOrigin}${item.href === "/" ? "" : item.href}`,
          })),
        }}
      />
      <nav className="breadcrumbs" aria-label="Percorso di navigazione">
        <ol>
          {completeItems.map((item, index) => {
            const isLast = index === completeItems.length - 1;
            return (
              <li key={item.href}>
                {isLast ? (
                  <span aria-current="page">{item.label}</span>
                ) : (
                  <a href={item.href}>{item.label}</a>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
