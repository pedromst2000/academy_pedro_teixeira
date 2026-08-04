import { useEffect, useState } from "react";
import { Checkbox, Divider, Form } from "antd";

function ChooseColumns({ form, data, handleSubmit }) {
  const [indeterminate, setIndeterminate] = useState(false);
  const [checkAll, setCheckAll] = useState(false);

  useEffect(() => {
    if (data && data.length && data.length > 0 && data[0]) {
      const dataKeys = Object.keys(data[0]);
      form.setFieldValue("columns", dataKeys);
    }
  }, [data, form]);

  function handleCheckAll(e) {
    if (data && data.length > 0 && data[0]) {
      form.setFieldValue("columns", e.target.checked ? Object.keys(data[0]) : []);
      if (e.target.checked) setIndeterminate(false);
      setCheckAll(e.target.checked);
    }
  }

  function handleChangeValues(e, all) {
    if (data && data.length > 0 && data[0]) {
      const dataKeys = Object.keys(data[0]);
      const selectedColumns = all.columns || [];
      setIndeterminate(dataKeys.length > 0 && selectedColumns.length > 0 && selectedColumns.length < dataKeys.length);
      setCheckAll(selectedColumns.length === dataKeys.length);
    }
  }


  return (
    <div className="flex flex-col justify-center items-center p-2">
      <p className="font-bold blue text-[20px] mb-6 mt-6">Escolha as colunas que deseja exportar</p>
      <Form form={form} onFinish={handleSubmit} onValuesChange={handleChangeValues}>
        <Checkbox indeterminate={indeterminate} onChange={handleCheckAll} checked={checkAll}>
          Check all
        </Checkbox>
        <Divider />
        <Form.Item name="columns">
          <Checkbox.Group>
            {data && data.length > 0 && data[0] ? Object.keys(data[0]).map((item) => (
              <Checkbox value={item} key={item}>{item}</Checkbox>
            )) : null}
          </Checkbox.Group>
        </Form.Item>
      </Form>
    </div>
  );
}

export default ChooseColumns;
