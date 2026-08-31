import jsPDF from "jspdf";
import axios from "axios";
import dayjs from "dayjs";

const certificate = {
  generate: async (data, certificateData) => {
    function renderVariables(template, data) {
      // Para lidar com templates nulos ou vazios
      if (!template) {
        return "";
      }
      return template.replace(/{{\s*([^}]+)\s*}}/g, (_, key) => {
        return data[key] ?? "";
      });
    }

    // Carrega a imagem do URL como blob e converte para data URL
    const loadImage = async (url) => {
      if (!url) {
        return null; // Devolve null se nenhum URL for fornecido
      }
      try {
        const response = await axios.get(url, { responseType: "blob" });
        const blob = response.data;
        
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve(reader.result);
          };
          reader.onerror = () => {
            reject(new Error(`Failed to read image blob from ${url}`));
          };
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.warn(`Warning: Failed to fetch image from ${url}: ${error.message}`);
        return null; // Devolve null em caso de erro em vez de lançar uma exceção
      }
    };

    try {
      const imageDataUrl = await loadImage(data.background);
      
      const pdf = new jsPDF("landscape", "pt", "a4"); // A4 landscape

      const width = 842;
      const height = 595;

      // Adiciona a imagem de fundo se estiver disponível, caso contrário, adiciona um fundo branco
      if (imageDataUrl) {
        pdf.addImage(imageDataUrl, "PNG", 0, 0, width, height);
      } else {
        // Fallback: background branco
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, width, height, "F");
      }

      const textoFinal = renderVariables(data.text, certificateData);
      pdf.html(`<div style="width: 1400px; font-size: 24px; font-family: Arial, sans-serif; line-height: 1.35; letter-spacing: 0;color: #000;">${textoFinal}</div>`, {
        callback: function (doc) {
          doc.save(data.fileName);
        },
        x: 60,
        y: 140,
        autoPaging: "text",
      });
    } catch (error) {
      console.error("Certificate generation error:", error);
      throw error;
    }
  },
};


/**
 * @function downloadCertificate
 * @description Utility function to download a certificate for a given course and user.
 * @param {Object} item - The course item containing certificate information.
 * @param {Array} progress - The user's progress data.
 * @param {Object} user - The user object.
 * @param {Object} config - Configuration object containing server IP.
 * @param {Object} endpoints - API endpoints for fetching certificate data.
 */

export const downloadCertificate = (item, progress, user, config, endpoints) => {
  axios
    .get(endpoints.course_certificate.readById, {
      params: { id: item.id_course_certificate },
    })
    .then((res) => {
      certificate.generate(
        {
          background: `${config.server_ip}/media/${res.data[0].background}`,
          text: res.data[0].text,
          fileName: `${item.name}-${user.name.replace(/\s+/g, "-")}.pdf`,
        },
        {
          name: user.name,
          course: item.name,
          date:
            progress.filter((p) => p.id_course === item.id && p.activity_type === "course").length > 0
              ? dayjs(progress.filter((p) => p.id_course === item.id && p.activity_type === "course")[0]?.created_at).format("YYYY-MM-DD HH:mm")
              : null,
        },
      );
    })
    .catch((err) => {
      console.log(err);
    });
};

export default certificate;
