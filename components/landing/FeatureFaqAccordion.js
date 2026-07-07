'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

/**
 * FAQ accordion. FAQPage JSON-LD is the caller's responsibility (via
 * lib/seo.js's faqPageJsonLd + <JsonLd>) — every page that renders this
 * component already emits that schema itself, so duplicating it here would
 * ship two identical FAQPage blocks on the same page.
 * @param {{ faqs: Array<{ q: string, a: string }> }} props
 */
export default function FeatureFaqAccordion({ faqs }) {
  return (
    <Accordion type="single" collapsible className="w-full space-y-3">
      {faqs.map(({ q, a }, i) => (
        <AccordionItem
          key={i}
          value={`faq-${i}`}
          className="border border-border rounded-xl bg-card px-6 shadow-sm data-[state=open]:shadow-md transition-shadow"
        >
          <AccordionTrigger className="font-semibold text-left hover:no-underline py-5">
            {q}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-5">
            {a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
