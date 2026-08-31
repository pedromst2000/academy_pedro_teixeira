import { useTranslation } from "react-i18next";
import MaterialIcon from "../../../../assets/Materiais.svg?react";
import config from "../../../../utils/config";
import { useEffect } from "react";
import { Collapse, Tabs } from "antd";
import "./objection.css";

export default function CourseObjection({ data }) {
  const { t } = useTranslation();

  useEffect(() => {
    console.log(data);
  }, []);


  return (
    <div className="mb-10">
      {data.objection && Object.keys(data.objection).length > 0 ? (
        <div className="flex flex-col">
          {data.objection.text && (
            <div key="objection-text" className="prose-content">
              <div dangerouslySetInnerHTML={{ __html: data.objection.text }} />
            </div>
          )}
          {data.objection.tabs && data.objection.tabs.length > 0 && (
            <div className="w-full mt-4">
              <Tabs
                type="card"
                size="large"
                items={data.objection.tabs.map((t, _tind) => ({
                  key: _tind,
                  label: t.label,
                  children: (
                    <Collapse
                      items={t.items.map((_i, _ind) => ({
                        key: `${t.label}-${_ind}`,
                        label: _i.title,
                        children: <div className="prose-content" dangerouslySetInnerHTML={{ __html: _i.text }} />,
                      }))}
                    />
                  ),
                }))}
              />
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-500">No objections available.</p>
      )}
    </div>
  );
}
