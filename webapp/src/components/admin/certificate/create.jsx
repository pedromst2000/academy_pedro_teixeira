import { useContext, useEffect, useState } from "react";
import { Button, Drawer, Form, Input, Modal, Select } from "antd";
import countries from "../../../utils/countries.json";

import { Context } from "../../../utils/context";
import Media from "../media/media";
import i18n from "../../../utils/i18n";
import { useNavigate } from "react-router-dom";

export default function Create({ data, open, close, validateCertificateName }) {
  const { create, languages, t } = useContext(Context);
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [mediaKey, setMediaKey] = useState(null);
  const [isOpenMedia, setIsOpenMedia] = useState(false);

  const [form] = Form.useForm();

  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      let aux = Object.assign({}, data);
      form.setFieldsValue(aux);
    }
  }, [open]);

  function onClose() {
    form.resetFields();
    close();
  }

  async function onSubmit(values) {
    setIsButtonLoading(true);
    values.id_lang = languages.filter((l) => l.code === i18n.language)[0].id;
    try {
      const inserted = await create({ data: values, table: "course_certificate" });
      setIsButtonLoading(false);
      close(true);
      form.resetFields();
      navigate(`/admin/certificate/${inserted.data.insertId}`);
    } catch (err) {
      console.log(err);
      setIsButtonLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      size={800}
      onCancel={onClose}
      maskClosable={false}
      title={t("Create certificate")}
      footer={[
        <Button size="large" loading={isButtonLoading} onClick={onClose}>
          {t("Cancel")}
        </Button>,
        <Button size="large" type="primary" loading={isButtonLoading} onClick={form.submit}>
          {t("Submit")}
        </Button>,
      ]}
    >
      <Form
        form={form}
        onFinish={onSubmit}
        layout="vertical"
        validateMessages={{
          required: "Este campo é obrigatório!",
        }}
      >
        <Form.Item name="id" hidden>
          <Input />
        </Form.Item>
        <Form.Item 
          name="name" 
          label={t("Name")} 
          rules={[
            { required: true },
            { validator: validateCertificateName, validateTrigger: ["onChange", "onBlur"] }
          ]}
        >
          <Input size="large" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
