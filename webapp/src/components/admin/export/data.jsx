import { Table } from "antd";
import { excludedColumns } from "../../../utils/exportExcludedColumns";

function ExportData({ data, columns }) {

  const filteredColumns = columns
    .filter((col) => !excludedColumns.includes(col.dataIndex))
    .map((col) => ({
      ...col,
      width: col.dataIndex.includes("question") || col.dataIndex.includes("answer") ? 300 :
        col.dataIndex.includes("course_name") || col.dataIndex.includes("course") || col.dataIndex.includes("test_name") ? 150 : col.width,
    })); // Exclui as colunas excluídas e aplica width 300px apenas às colunas especificadas
  return (
    <div className="flex flex-col justify-center items-center p-2">
      <p className="blue text-[20px] mt-6">Vão ser exportados:</p>
      <p className="font-bold blue text-[40px] mt-2 mb-2">{data.length}</p>
      <Table
        columns={filteredColumns}
        dataSource={data}
        scroll={{ x: "max-content" }}
        pagination={{
          pageSize: 5, // máximo 5 por página
          position: ["bottomCenter"], // paginação ao centro
        }}
      />
    </div>
  );
}

export default ExportData;
