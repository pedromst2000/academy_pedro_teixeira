import { Table } from "antd";
import { excludedColumns } from "../../../utils/exportExcludedColumns";

function ExportData({ data, columns }) {
  const filteredColumns = columns.filter((col) => !excludedColumns.includes(col.dataIndex)); // Exclui as colunas excluídas do conjunto de colunas a serem exibidas na tabela
  return (
    <div className="flex flex-col justify-center items-center p-2">
      <p className="blue text-[20px] mt-6">Vão ser exportados:</p>
      <p className="font-bold blue text-[40px] mt-2 mb-2">{data.length}</p>
      <Table columns={filteredColumns} dataSource={data} scroll={{ x: 1 }} />
    </div>
  );
}

export default ExportData;
