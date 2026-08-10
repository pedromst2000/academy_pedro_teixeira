import { useState, useEffect } from "react";
import { Button, Drawer, Steps, Form } from "antd";
import dayjs from "dayjs";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

import ChooseColumns from "./columns";
import ExportData from "./data";
import { columnExcelWidths, excludedColumns } from "../../../utils/columns";

export default function ExportTable({ open, close, data, table }) {
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [dataToExport, setDataToExport] = useState([]);
  const [columnsToExport, setColumnsToExport] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selectedColumns, setSelectedColumns] = useState([]);

  const [form] = Form.useForm();

  useEffect(() => {
    console.log(data);
    let aux = [];
    setDataToExport(data);
  }, [data]);

  // Restaura as colunas selecionadas ao voltar ao passo anterior (apenas quando é clicado "Anterior")
  useEffect(() => {
    if (current === 0 && columnsToExport.length > 0 && open) {
      const columnNames = columnsToExport.map((col) => col.dataIndex);
      form.setFieldValue("columns", columnNames);
      setSelectedColumns(columnNames);
    }
  }, [current, columnsToExport, form, open]);

  // Resetar completamente quando drawer fecha
  useEffect(() => {
    if (!open) {
      form.resetFields();
      setSelectedColumns([]);
      setColumnsToExport([]);
      setCurrent(0);
    }
  }, [open, form]);

  function handleClose() {
    close(); 
  }

  function handleExport() {
    setIsButtonLoading(true);
    let fileName = `${dayjs().format("YYYY-MM-DD")}_${dayjs().format("HHmmss")}_${table}Export.xlsx`;
    let exportData = [];

    // Remove as colunas excluídas da lista de colunas a exportar
    const filteredColumnsToExport = columnsToExport.filter(
      (col) => !excludedColumns.includes(col.dataIndex),
    );

    // Verifica se "course_name" e "course" estão presentes em simultâneo, para evitar duplicação se o curso já existir
    const hasCourseName = filteredColumnsToExport.some(
      (col) => col.dataIndex === "course_name",
    );
    const hasCourse = filteredColumnsToExport.some(
      (col) => col.dataIndex === "course",
    );
    let finalColumnsToExport = filteredColumnsToExport;

    if (hasCourseName && hasCourse) {
      finalColumnsToExport = finalColumnsToExport.filter(
        (col) => col.dataIndex !== "course",
      );
    } else if (
      !hasCourse &&
      !hasCourseName &&
      dataToExport.length > 0 &&
      "course" in dataToExport[0]
    ) {
      finalColumnsToExport.push({ title: "course", dataIndex: "course" });
    }

    // Adiciona lang sempre como última coluna
    if (dataToExport.length > 0 && "lang" in dataToExport[0]) {
      finalColumnsToExport.push({ title: "lang", dataIndex: "lang" });
    }

    const columnsForExport = finalColumnsToExport;

    const headers = columnsForExport.map((column) => column.title);
    exportData.push(headers);

    dataToExport.forEach((row) => {
      let rowData = columnsForExport.map((column) => {
        let value = row[column.dataIndex || column.key];
        if (
          typeof value === "object" &&
          value?.props &&
          value.props?.children
        ) {
          value = value?.props?.children;
        }
        return value;
      });
      exportData.push(rowData);
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(exportData);

    // Define as larguras das colunas do Excel baseado na configuração centralizada
    const colWidths = columnsForExport.map((col) => {
      const colConfig = columnExcelWidths.columns[col.dataIndex];
      return colConfig || columnExcelWidths.defaultWidth;
    });
    worksheet["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    const excelBuffer = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
    });
    const file = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(file, fileName);
    close();
    setIsButtonLoading(false);
  }

  function handleChooseColumns(e) {
    let auxColumns = e.columns;
    let aux = [];
    for (let i = 0; i < auxColumns.length; i++) {
      aux.push({
        title: auxColumns[i],
        dataIndex: auxColumns[i],
      });
    }

    setColumnsToExport(aux);
    setCurrent(1);
  }

  function handleChangeStep(e) {
    setCurrent(e);
  }

  function handleFormColumnsChange(changedValues, allValues) {
    // Atualiza o estado com as colunas selecionadas do formulário em tempo real
    const columns = allValues.columns || [];
    setSelectedColumns(columns);
  }

  return (
    <Drawer
      key="drawer-export"
      title="Exportar"
      size={800}
      onClose={handleClose}
      open={open}
      extra={[
        <div>
          {current === 0 && (
            <Button
              type="primary"
              onClick={form.submit}
              disabled={selectedColumns.length === 0}
            >
              Seguinte
            </Button>
          )}
          {current === 1 && (
            <>
              <Button className="mr-2" onClick={() => setCurrent(0)}>
                Anterior
              </Button>
              <Button
                loading={isButtonLoading}
                type="primary"
                onClick={handleExport}
              >
                Exportar
              </Button>
            </>
          )}
        </div>,
      ]}
    >
      {open && (
        <div>
          <Steps
            current={current}
            onChange={handleChangeStep}
            className="register-steps"
            items={[
              {
                title: "Escolher colunas",
              },
              {
                title: "Exportar dados",
              },
            ]}
          />
          {current === 0 && (
            <ChooseColumns
              form={form}
              handleSubmit={handleChooseColumns}
              data={dataToExport}
              onFormChange={handleFormColumnsChange}
            />
          )}
          {current === 1 && (
            <ExportData
              data={dataToExport}
              columns={columnsToExport}
              table={table}
            />
          )}
        </div>
      )}
    </Drawer>
  );
}
