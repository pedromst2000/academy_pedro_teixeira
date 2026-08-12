/**
 * @constant ColumnWidths
 * @description This constant defines the column widths for the Excel export. The widths are specified in characters (wch) and are based on the expected content of each column. The default width is applied to any columns not explicitly defined.
 * @type {Object}
 * @property {Object} columns - An object mapping column dataIndex to their respective widths.
 * @property {Object} defaultWidth - The default width for columns not explicitly defined.
 */

export const columnExcelWidths = {
  columns: {
    name: { wch: 25 }, // 187px
    course_name: { wch: 40 }, // 300px
    test_name: { wch: 40 }, // 300px
    email: { wch: 40 }, // 300px
    user_name: { wch: 25 }, // 187px
    user_email: { wch: 40 }, // 300px
    user_country: { wch: 20 }, // 150px
    course: { wch: 40 }, // 300px
    answer: { wch: 80 }, // 620px
    question: { wch: 120 }, // 895px
  },
  defaultWidth: { wch: 11 }, // Largura padrão para outras colunas
};
