import { useContext, useEffect, useState } from "react";
import { Button, Drawer, Input, Form } from "antd";

import { Context } from "../../../utils/context";

export default function Translations({ data, defaultLanguage, open, close }) {
  const { update } = useContext(Context);
  const [isButtonLoading, setIsButtonLoading] = useState(false);

  const [form] = Form.useForm();

  useEffect(() => {
    if (open && data && defaultLanguage) {
      // console.log('🔵 Opening translations drawer for:', data);
      form.resetFields();
      
      const aux = Object.assign([], data);
      if (!aux.translation) {
        // Se não houver tradução, usar como base as chaves do idioma padrão
        const newTranlations = [];
        if (defaultLanguage.translation) {
          try {
            const defaultTrans = JSON.parse(defaultLanguage.translation);
            for (let i = 0; i < defaultTrans.length; i++) {
              newTranlations.push({ key: defaultTrans[i].key, value: "" });
            }
            form.setFieldsValue({ translations: newTranlations });
          } catch (err) {
            console.error("Error parsing default language translations:", err);
            form.setFieldsValue({ translations: [] });
          }
        }
      } else {
        try {
          const parsedTranslations = JSON.parse(aux.translation) || [];
          // console.log('✅ Loaded translations:', parsedTranslations);
          form.setFieldsValue({ translations: parsedTranslations });
        } catch (err) {
          console.error("Error parsing language translations:", err);
          form.setFieldsValue({ translations: [] });
        }
      }
    }
  }, [open, data, defaultLanguage, form]);

  function onClose() {
    form.resetFields();
    close();
  }

  async function submit(values) {
    setIsButtonLoading(true);
    try {
      if (!values.translations || values.translations.length === 0) {
        setIsButtonLoading(false);
        return;
      }

      const countryData = typeof data.country === 'string' ? JSON.parse(data.country) : data.country;
      
      await update({ 
        data: { 
          id: data.id, 
          country: countryData,
          translation: JSON.stringify(values.translations) 
        }, 
        table: "language" 
      });
      
      // Wait a moment to ensure backend has persisted the change
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // console.log('✅ Translations saved, closing drawer...');
      form.resetFields();
      close(true);
    } catch (err) {
      console.error("Error saving translations:", err);
    } finally {
      setIsButtonLoading(false);
    }
  }

  return (
    <Drawer open={open} size={800} onClose={onClose} maskClosable={false} title="Traduções" extra={[]}>
      {data && defaultLanguage ? (
        <Form form={form} onFinish={submit}>
          <Form.List name="translations">
            {(fields, { add, remove, move }) => (
              <div>
                <div className={`grid grid-cols-2 gap-4 mb-4`}>
                  <div><strong>{defaultLanguage.name}</strong></div>
                  <div><strong>{data.name}</strong></div>
                </div>
                {fields.map((field) => (
                  <div key={field.key} className={`grid grid-cols-2 gap-4 mb-2`}>
                    <Form.Item name={[field.name, "key"]} rules={[{ required: true, message: "Key is required" }]}>
                      <Input size="large" placeholder="Translation key" />
                    </Form.Item>
                    <Form.Item name={[field.name, "value"]} rules={[{ required: true, message: "Value is required" }]}>
                      <Input size="large" placeholder="Translation value" />
                    </Form.Item>
                  </div>
                ))}
                <Button onClick={() => add()} className="mb-4">Add translation</Button>
              </div>
            )}
          </Form.List>
          <Button type="primary" loading={isButtonLoading} onClick={form.submit} className="mt-4">
            Save
          </Button>
        </Form>
      ) : (
        <p>Loading...</p>
      )}
    </Drawer>
  );
}
