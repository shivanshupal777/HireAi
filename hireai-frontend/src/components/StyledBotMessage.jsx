import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const StyledBotMessage = ({ content }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Style the paragraphs
        p: ({ node, ...props }) => <p className="mb-4 last:mb-0" {...props} />,
        
        // Style the bullet point lists
        ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />,
        
        // Style the bold text to make it stand out
        strong: ({ node, ...props }) => <strong className="font-semibold text-blue-300" {...props} />,

        // You can even style headings if the AI uses them
        h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-3" {...props} />,
        h2: ({ node, ...props }) => <h2 className="text-xl font-bold mb-3" {...props} />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default StyledBotMessage;