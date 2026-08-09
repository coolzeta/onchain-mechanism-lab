import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h2: (props) => <h2 className="lesson-h2" {...props} />,
    h3: (props) => <h3 className="lesson-h3" {...props} />,
    p: (props) => <p className="lesson-p" {...props} />,
    ul: (props) => <ul className="lesson-list" {...props} />,
    ol: (props) => <ol className="lesson-list lesson-list--ordered" {...props} />,
    blockquote: (props) => <blockquote className="lesson-quote" {...props} />,
    code: (props) => <code className="inline-code" {...props} />,
    pre: (props) => <pre className="lesson-code" {...props} />,
    a: (props) => <a className="lesson-link" target="_blank" rel="noreferrer" {...props} />,
    ...components,
  };
}
