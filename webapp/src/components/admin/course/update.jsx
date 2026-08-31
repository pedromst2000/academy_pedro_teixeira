import { useContext, useEffect, useState } from "react";
import {
	Button,
	Modal,
	Form,
	Input,
	Select,
} from "antd";

import Media from "../media/media";
import { Context } from "../../../utils/context";
import { useNavigate } from "react-router-dom";

export default function Update({ data, open, close, products, validateInternalName }) {
	const { update, t, selectedLanguage } = useContext(Context);
	const [isButtonLoading, setIsButtonLoading] = useState(false);
	const [mediaKey, setMediaKey] = useState(null);
	const [isOpenMedia, setIsOpenMedia] = useState(false);

	const [form] = Form.useForm();

	const navigate = useNavigate();

	useEffect(() => {
		if (open) form.setFieldsValue(data);
	}, [data, open]);

	function onClose() {
		form.resetFields();
		close();
	}

	async function submit(values) {
		setIsButtonLoading(true);
		try {
			const res = await update({
				data: { ...values, id_lang: selectedLanguage.id },
				table: "course",
			});
			setIsButtonLoading(false);
			close(true);
		} catch (err) {
			console.log(err);
			setIsButtonLoading(false);
		}
	}

	function openMedia(key) {
		setMediaKey(key);
		setIsOpenMedia(true);
	}

	function closeMedia(res) {
		if (res) {
			form.setFieldValue(mediaKey, res[mediaKey]);
		}

		setMediaKey(null);
		setIsOpenMedia(false);
	}

	return (
    <Modal
      key="modal-logout"
      width={500}
      style={{ top: 20 }}
      onCancel={close}
      open={open}
      maskClosable={false}
      footer={[
        <Button onClick={close}>{t("Cancel")}</Button>,
        <Button type="primary" loading={isButtonLoading} onClick={form.submit}>
          {t("Save")}
        </Button>,
      ]}
    >
      <Media mediaKey={mediaKey} open={isOpenMedia} close={closeMedia} />
      <p className="text-[16px] font-bold mb-4">{t("Update Course")}</p>
      <Form
        form={form}
        onFinish={submit}
        layout="vertical"
        validateMessages={{
          required: "Este campo é obrigatório!",
        }}
      >
        <Form.Item name="id" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="name" label={t("Name")} rules={[{ required: true }]}>
          <Input size="large" placeholder={t("Enter course name")} />
        </Form.Item>
        <Form.Item
          name="internal_name"
          label={t("Internal name")}
          rules={[
            { required: true },
            { validator: (_, value) => validateInternalName(_, value, data?.id), validateTrigger: ["onChange", "onBlur"] },
          ]}
        >
          <Input size="large" placeholder={t("Enter internal course name")} />
        </Form.Item>
        <Form.Item
          name="status"
          label={t("Status")}
          rules={[{ required: true }]}
        >
          <Select
            size="large"
            className="w-full"
            placeholder="Selecione..."
            showSearch={{
              optionFilterProp: ["label"],
            }}
            options={[
              {
                label: "Draft",
                value: "draft",
              },
              {
                label: "Published",
                value: "published",
              },
            ]}
          />
        </Form.Item>
        <Form.Item
          name="id_product"
          label={t("Product")}
          rules={[{ required: true }]}
        >
          <Select
            size="large"
            className="w-full"
            placeholder="Selecione..."
            showSearch={{
              optionFilterProp: ["label"],
            }}
            options={products
              .filter((p) => p.is_deleted === 0)
              .map((p) => ({ label: p.name, value: p.id }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
