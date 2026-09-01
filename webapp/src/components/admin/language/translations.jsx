import { useContext, useEffect, useState } from "react";
import { Button, Drawer, Input, Form, Table, Space, Popconfirm, Pagination, message, Dropdown, Modal } from "antd";
import { DeleteOutlined, PlusOutlined, EditOutlined } from "@ant-design/icons";

import { Context } from "../../../utils/context";

export default function Translations({ data, defaultLanguage, open, close }) {
  const { update } = useContext(Context);
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [form] = Form.useForm();
  
  const [translations, setTranslations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingKey, setEditingKey] = useState("");
  const [deleteConfirmRecord, setDeleteConfirmRecord] = useState(null);

  useEffect(() => {
    if (open && data && defaultLanguage) {
      // Load translations data
      const aux = Object.assign([], data);
      let loadedTranslations = [];

      if (!aux.translation) {
        // If no translation, use default language keys as base
        if (defaultLanguage.translation) {
          try {
            const defaultTrans = JSON.parse(defaultLanguage.translation);
            loadedTranslations = defaultTrans.map((item, index) => ({
              ...item,
              id: `${index}-${Date.now()}`, // Unique ID for each row
            }));
          } catch (err) {
            console.error("Error parsing default language translations:", err);
          }
        }
      } else {
        try {
          const parsedTranslations = JSON.parse(aux.translation) || [];
          loadedTranslations = parsedTranslations.map((item, index) => ({
            ...item,
            id: `${index}-${Date.now()}`, // Unique ID for each row
          }));
        } catch (err) {
          console.error("Error parsing language translations:", err);
        }
      }

      setTranslations(loadedTranslations);
      setCurrentPage(1);
      setEditingKey("");
    }
  }, [open, data, defaultLanguage]);

  function onClose() {
    setEditingKey("");
    close();
  }

  const isEditing = (record) => record.id === editingKey;

  const edit = (record) => {
    form.setFieldsValue({
      key: record.key,
      value: record.value,
    });
    setEditingKey(record.id);
  };

  const cancel = () => {
    setEditingKey("");
  };

  const save = async (id) => {
    try {
      const row = await form.validateFields();
      const newData = [...translations];
      const index = newData.findIndex((item) => id === item.id);
      
      if (index > -1) {
        const item = newData[index];
        newData.splice(index, 1, { ...item, ...row });
        setTranslations(newData);
        setEditingKey("");
      }
    } catch (errInfo) {
      console.log("Validate Failed:", errInfo);
    }
  };

  const addRow = () => {
    const newId = `${translations.length}-${Date.now()}`;
    const newTranslation = {
      id: newId,
      key: "",
      value: "",
    };
    setTranslations([...translations, newTranslation]);
    // Auto-edit the new row
    setEditingKey(newId);
    form.setFieldsValue({ key: "", value: "" });
  };

  const deleteRow = (id) => {
    const newData = translations.filter((item) => item.id !== id);
    setTranslations(newData);
  };

  async function submit() {
    setIsButtonLoading(true);
    try {
      // Validate that all rows have key and value
      for (const trans of translations) {
        if (!trans.key || !trans.value) {
          message.error("All rows must have a Key and Translation value");
          setIsButtonLoading(false);
          return;
        }
      }

      if (translations.length === 0) {
        message.error("At least one translation is required");
        setIsButtonLoading(false);
        return;
      }

      // Remove the id field before saving
      const translationsToSave = translations.map((trans) => {
        const { id: _unused, ...rest } = trans;
        return rest;
      });

      const countryData =
        typeof data.country === "string" ? JSON.parse(data.country) : data.country;

      await update({
        data: {
          id: data.id,
          country: countryData,
          translation: JSON.stringify(translationsToSave),
        },
        table: "language",
      });

      message.success("Translations saved successfully!");
      await new Promise((resolve) => setTimeout(resolve, 500));

      setEditingKey("");
      close(true);
    } catch (err) {
      console.error("Error saving translations:", err);
      message.error("Error saving translations");
    } finally {
      setIsButtonLoading(false);
    }
  }

  // Table columns configuration
  const columns = [
    {
      title: "Key",
      dataIndex: "key",
      key: "key",
      width: "40%",
      editable: true,
      render: (text, record) => {
        const isEdited = isEditing(record);
        return isEdited ? (
          <Form.Item name="key" rules={[{ required: true, message: "Key is required" }]} style={{ margin: 0 }}>
            <Input placeholder="Translation key" size="large" />
          </Form.Item>
        ) : (
          <span>{text}</span>
        );
      },
    },
    {
      title: `${data?.name || "Translation"}`,
      dataIndex: "value",
      key: "value",
      width: "50%",
      editable: true,
      render: (text, record) => {
        const isEdited = isEditing(record);
        return isEdited ? (
          <Form.Item name="value" rules={[{ required: true, message: "Translation value is required" }]} style={{ margin: 0 }}>
            <Input.TextArea placeholder="Translation value" rows={2} />
          </Form.Item>
        ) : (
          <span>{text}</span>
        );
      },
    },
    {
      title: "Ações",
      key: "actions",
      width: "10%",
      render: (_, record) => {
        const isEdited = isEditing(record);
        
        if (isEdited) {
          return (
            <Space size="small">
              <Button type="primary" size="small" onClick={() => save(record.id)}>
                Save
              </Button>
              <Button size="small" onClick={cancel}>
                Cancel
              </Button>
            </Space>
          );
        }

        const items = [
          {
            key: "edit",
            label: "Update",
            icon: <EditOutlined />,
            onClick: () => edit(record),
          },
          {
            key: "delete",
            label: "Delete",
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => setDeleteConfirmRecord(record),
          },
        ];

        return (
          <Dropdown menu={{ items }}>
            <Button type="text" size="small">
              ⋮
            </Button>
          </Dropdown>
        );
      },
    },
  ];

  // Pagination
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedTranslations = translations.slice(startIndex, endIndex);

  return (
    <Drawer
      open={open}
      size={1000}
      onClose={onClose}
      maskClosable={false}
      title={`Traduções - ${data?.name || "Language"}`}
      extra={[]}
    >
      {data && defaultLanguage ? (
        <div>
          <Form form={form} layout="vertical">
            {/* Table with inline editing */}
            <Table
              columns={columns}
              dataSource={paginatedTranslations}
              rowKey="id"
              pagination={false}
              size="small"
              bordered
              className="mb-4"
              scroll={{ x: true }}
            />

            {/* Pagination Controls */}
            {translations.length > pageSize && (
              <div className="flex justify-between items-center mb-4">
                <span>
                  Total de registos: <strong>{translations.length}</strong>
                </span>
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={translations.length}
                  onChange={(page) => {
                    setCurrentPage(page);
                    setEditingKey(""); // Cancel editing when changing page
                  }}
                  onShowSizeChange={(current, size) => {
                    setPageSize(size);
                    setCurrentPage(1);
                    setEditingKey(""); // Cancel editing when changing page size
                  }}
                  showSizeChanger
                  showTotal={(total, range) => `${range[0]}-${range[1]} de ${total}`}
                />
              </div>
            )}

            {/* Add New Row Button */}
            <div className="mb-4 flex gap-2">
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={addRow}
                size="large"
                block
              >
                Add Translation
              </Button>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-2">
              <Button onClick={onClose}>Cancel</Button>
              <Button
                type="primary"
                loading={isButtonLoading}
                onClick={submit}
                size="large"
              >
                Save All Translations
              </Button>
            </div>
          </Form>

          {/* Delete Confirmation Modal */}
          {deleteConfirmRecord && (
            <Popconfirm
              title="Delete Translation"
              description="Are you sure you want to delete this translation?"
              open={!!deleteConfirmRecord}
              okText="Yes"
              cancelText="No"
              onConfirm={() => {
                deleteRow(deleteConfirmRecord.id);
                setDeleteConfirmRecord(null);
              }}
              onCancel={() => setDeleteConfirmRecord(null)}
            />
          )}
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </Drawer>
  );
}
