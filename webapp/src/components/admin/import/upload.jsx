import { useState } from "react";
import { Form, Upload, Spin, Button, message } from "antd";
import { UploadOutlined, InboxOutlined, LoadingOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";

const { Dragger } = Upload;

function UploadFile({
  next,
  requiredColumns = [],
  title = "Importar ficheiro",
  description = "Faça importação do ficheiro em XLSX",
  mode = "dragger",
  successMessage = null,
  formatInfo = null,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [fileList, setFileList] = useState([]);

  const uploadProps = {
    accept: ".xlsx,.xls",
    name: "file",
    multiple: false,
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file) => {
      setFileList([file]);
      handleFileChange(file);
      return false; // Prevent auto upload
    },
    onDrop(e) {
      console.log("Dropped files", e.dataTransfer.files);
    },
    fileList,
    defaultFileList: [],
  };

  const handleFileChange = (fileOrEvent) => {
    // Handle both direct file (from Dragger) and event object (from Upload button)
    const file = fileOrEvent?.file || fileOrEvent;
    if (!file) return;

    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, {
          header: 0,
          defval: null,
        });

        // Validate required columns if specified
        if (requiredColumns.length > 0) {
          if (jsonData.length === 0) {
            message.error("Excel file is empty");
            setIsLoading(false);
            return;
          }

          const firstRow = jsonData[0];
          const missingColumns = requiredColumns.filter((col) => !Object.prototype.hasOwnProperty.call(firstRow, col));

          if (missingColumns.length > 0) {
            message.error(`Excel file must have the following columns: ${missingColumns.join(", ")}`);
            setIsLoading(false);
            return;
          }
        }

        const successMsg =
          successMessage || `Ficheiro carregado com sucesso! ${jsonData.length} linhas encontradas`;
        message.success(successMsg);
        setIsLoading(false);
        next(jsonData);
      } catch (err) {
        console.error("Error parsing file:", err);
        message.error("Error reading Excel file. Please check the format.");
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <Spin spinning={isLoading} tip={mode === "dragger" ? "Uploading..." : undefined} indicator={<LoadingOutlined spin />}>
      <div>
        <p className={mode === "dragger" ? "text-[26px] font-bold text-center" : "text-[26px] font-bold text-center mb-0"}>{title}</p>
        <p className={mode === "dragger" ? "text-center mt-2 mb-4" : "text-center mt-2 mb-6"}>{description}</p>

        {mode === "dragger" ? (
          <Dragger {...uploadProps} style={{ maxHeight: 400 }} className="import_users_dragger">
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="text-[16px]">Click or drag file to this area to upload</p>
            <p className="text-[12px] mt-2">
              Import a <b>XLSX</b> file
            </p>
          </Dragger>
        ) : (
          <div className="flex justify-center mb-6">
            <Upload {...uploadProps} onChange={handleFileChange}>
              <Button icon={<UploadOutlined />} size="large">
                Selecionar Ficheiro
              </Button>
            </Upload>
          </div>
        )}

        {formatInfo && (
          <div className="bg-blue-50 p-4 rounded border border-blue-200">
            <p className="font-semibold mb-2">Formato esperado:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {formatInfo.map((info, idx) => (
                <li key={idx}>{info}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Spin>
  );
}

export default UploadFile;
