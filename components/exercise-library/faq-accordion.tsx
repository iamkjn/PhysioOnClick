// A no-JS FAQ list built on native <details>/<summary> — keyboard accessible and
// works without hydration. Server component.

export function FaqAccordion({ faqs }: { faqs: { q: string; a: string }[] }) {
  return (
    <div className="exlib-faq">
      {faqs.map((faq, i) => (
        <details key={i} className="exlib-faq__item">
          <summary className="exlib-faq__q">{faq.q}</summary>
          <div className="exlib-faq__answer">
            <p>{faq.a}</p>
          </div>
        </details>
      ))}
    </div>
  );
}
