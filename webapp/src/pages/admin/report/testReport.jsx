import axios from "axios";
import { useContext, useEffect } from "react";
import { useState } from "react";
import { Button, Dropdown, Form, Select, Tag } from "antd";
import { IoMdMore } from "react-icons/io";
import { FaRegEdit, FaRegFile, FaRegTrashAlt } from "react-icons/fa";
import { RxReload } from "react-icons/rx";

import Table from "../../../components/admin/table";

import { Context } from "../../../utils/context";

import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import ExportTable from "../../../components/admin/export/export";
import DownloadIcon from "../../../assets/Backoffice/download.svg?react";
import SearchIcon from "../../../assets/Backoffice/search.svg?react";

export default function TestReport({ data }) {
  const { user, selectedLanguage, languages } = useContext(Context);
  const [tableData, setTableData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [dataToExport, setDataToExport] = useState([]);
  const [courses, setCourses] = useState([]);
  const [activity, setActivity] = useState([]);
  const [countries, setCountries] = useState([]);
  const [isOpenExport, setIsOpenExport] = useState(false);

  const { t } = useTranslation();

  const [form] = Form.useForm();

  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      prepareData(data);
      setCourses(data.courses);
      setActivity(data.acitivty);
    }
  }, [data]);

  useEffect(() => {
    setCountries(
      JSON.parse(
        languages.filter((l) => l.id === selectedLanguage.id)[0].country,
      ),
    );
  }, [selectedLanguage]);

  function prepareData(obj) {
    console.log(obj);
    let aux = [];
    if (obj.users && obj.activity && obj.activity.length > 0) {
      let testsActivity = obj.activity.filter(
        (a) => a.activity_type === "test",
      );
      for (let i = 0; i < testsActivity.length; i++) {
        let item = testsActivity[i];

        item.meta_data =
          item.meta_data && typeof item.meta_data === "string"
            ? JSON.parse(item.meta_data)
            : item.meta_data;

        let test = obj.tests.filter((t) => t.id === item.id_course_test)[0];
        let testQuestions = test.question && typeof test.question === "string" ? JSON.parse(test.question) : test.question;
        const titlesOrder = testQuestions.map((item) => item.title);

        let resTestOrdered = item.meta_data.items.sort(function (a, b) {
          return titlesOrder.indexOf(a.title) - titlesOrder.indexOf(b.title);
        });

        item.meta_data.items = resTestOrdered;

        let auxObj = {
          id: item.id,
          id_course: obj.courses.filter((c) => c.id === item.id_course)[0].id,
          test_name: item.test_title,
          date: item.created_at
            ? dayjs(item.created_at).format("DD/MM/YYYY")
            : item.created_at,
          user_name: obj.users.filter((u) => u.id === item.id_user)[0].name,
          user_email: obj.users.filter((u) => u.id === item.id_user)[0].email,
          user_country: obj.users.filter((u) => u.id === item.id_user)[0]
            .country,
          course: obj.courses.filter((c) => c.id === item.id_course)[0].name,
          score: `${item.meta_data.items.filter((q) => q.is_correct).length}/${item.meta_data.items.length}`,
          percentage:
            item.meta_data.items.length > 0
              ? `${(item.meta_data.items.filter((q) => q.is_correct).length * 100) / item.meta_data.items.length}%`
              : "0%",
          time:
            item.meta_data.time >= 60
              ? `${Math.floor(item.meta_data.time / 60)} min`
              : `${item.meta_data.time} s`,
          approved: item.is_completed ? "yes" : "no",
          meta_data: item.meta_data, // manter a propriedade meta_data para uso posterior na renderização da tabela expandida
        };

        aux.push(auxObj);
      }
    }
    setTableData(aux);
    setFilteredData(aux);
  }

  function filterData(values) {
    let newData = Object.assign([], activity);

    if (values.test)
      newData = newData.filter((n) => n.id_course_test === values.test);
    if (values.country && values.country.length > 0) {
      let coursesOfCountry = courses
        .filter((n) => {
          const matches = n.settings.country.some((item) =>
            values.country.includes(item),
          );
          return n.settings.country_limit ? matches : true;
        })
        .map((c) => c.id);

      newData = newData.filter((n) => {
        const matches = coursesOfCountry.includes(n.id_course);
        return matches;
      });
    }

    prepareData({ ...data, activity: newData });
  }

  function onChange(pagination, filters, sorter, extra) {
    setFilteredData(extra.currentDataSource);
  }

  function openExport(data) {
    setDataToExport(data);
    setIsOpenExport(true);
  }

  function closeExport() {
    setIsOpenExport(false);
  }

  const expandedRowRender = (e) => {
    const columnsExpanded = [
      {
        title: t("Question"),
        dataIndex: "question",
        key: "question",
        width: "300px",
      },
      {
        title: t("Answer"),
        dataIndex: "answer",
        key: "answer",
        width: "300px",
      },
      {
        title: t("Result"),
        dataIndex: "result",
        key: "result",
        width: "300px",
      },
    ];

    const dataExpanded = [];

    if (e.meta_data && e.meta_data.items && e.meta_data.items.length > 0) {
      for (let i = 0; i < e.meta_data.items.length; i++) {
        let _question_ = e.meta_data.items[i];
        dataExpanded.push({
          key: i,
          question: _question_.title,
          answer: _question_.myAnswer,
          result: _question_.is_correct ? t("Correct") : t("Incorrect"),
        });
      }
    }

    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <p className="font-bold mb-2 mt-4">{t("Questions")}</p>
          <Button
            className="min-w-50"
            size="large"
            variant="solid"
            color="blue"
            disabled={dataExpanded.length === 0}
            onClick={() => openExport(dataExpanded)}
            icon={<DownloadIcon />}
          >
            {t("Export excel")}
          </Button>
        </div>
        <Table
          className="expanded_table"
          columns={columnsExpanded}
          dataSource={dataExpanded}
          pagination={{
            pageSize: 5, // máximo 5 por página
            position: ["bottomCenter"],
          }}
        />
      </div>
    );
  };

  return (
    <div className="p-4">
      <ExportTable
        open={isOpenExport}
        close={closeExport}
        data={dataToExport}
        table={"CoursesReport"}
      />
      <Form form={form} layout="vertical" onFinish={filterData}>
        <div className="grid grid-cols-4 gap-8 mb-4 mt-4">
          <div className="flex justify-end items-end">
            <Button
              className="w-full!"
              size="large"
              variant="solid"
              color="blue"
              // Quando não existe dados na tabela, o botão de exportar é desativado
              disabled={tableData.length === 0}
              onClick={() =>
                openExport(filteredData.length > 0 ? filteredData : tableData)
              }
              icon={<DownloadIcon />}
            >
              {t("Export excel")}
            </Button>
          </div>
          <Form.Item name="course" label={t("Course")} className="mb-0!">
            <Select
              allowClear
              size="large"
              className="w-full"
              placeholder={t("Select course")}
              showSearch={{
                optionFilterProp: ["label"],
              }}
              options={courses.map((c) => ({ label: c.name, value: c.id }))}
            />
          </Form.Item>
          <Form.Item name="country" label={t("Country")} className="mb-0!">
            <Select
              mode="multiple"
              allowClear
              size="large"
              className="w-full"
              placeholder={t("Select country")}
              showSearch={{
                optionFilterProp: ["label"],
              }}
              options={countries.map((c) => ({
                label: c,
                value: c,
              }))}
            />
          </Form.Item>
          <div className="flex justify-center items-end">
            <Button
              className="w-full"
              size="large"
              onClick={form.submit}
              type="primary"
              icon={<SearchIcon />}
            >
              {t("Search")}
            </Button>
          </div>
        </div>
      </Form>
      <div className="p-4 bg-white rounded-[5px]">
        <Table
          rowKey="id"
          onChange={onChange}
          expandable={{ expandedRowRender }}
          dataSource={tableData}
          pagination={{
            pageSize: 5, // máximo 5 por página
            position: ["bottomCenter"], // paginação ao centro
          }}
          columns={[
            {
              title: t("Test"),
              dataIndex: "test_name",
              key: "test_name",
              width: "300px",
            },
            {
              title: t("Date"),
              dataIndex: "date",
              key: "date",
            },
            {
              title: t("Name"),
              dataIndex: "user_name",
              key: "user_name",
            },
            {
              title: t("E-mail"),
              dataIndex: "user_email",
              key: "user_email",
            },
            {
              title: t("Course"),
              dataIndex: "course",
              key: "course",
            },
            {
              title: t("Score"),
              dataIndex: "score",
              key: "score",
            },
            {
              title: t("Percentage"),
              dataIndex: "percentage",
              key: "percentage",
            },
            {
              title: t("Time"),
              dataIndex: "time",
              key: "time",
            },
            {
              title: t("Approved"),
              dataIndex: "approved",
              key: "approved",
            },
          ]}
        />
      </div>
    </div>
  );
}
