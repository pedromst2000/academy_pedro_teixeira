import { withLayout } from "../../components/layout";
import { Section } from "../../components/section";

const RichTextInner = {
  fields: {
    richtext: {
      type: "richtext",
      contentEditable: true,
      options: {
        heading: true,
        listItem: true,
        bulletList: true,
        orderedList: true,
      },
    },
  },
  render: ({ richtext }) => {
    return (
      <Section>
        {typeof richtext === "string" ? (
          <div dangerouslySetInnerHTML={{ __html: richtext }} />
        ) : (
          richtext
        )}
      </Section>
    );
  },
  defaultProps: {
    richtext: "<h2>Heading</h2><p>Body</p>",
  },
};

const RichText = withLayout(RichTextInner);

export default RichText;
