// components/LanguageSwitcher.jsx
import { useTranslation } from "react-i18next";
import Select from "react-select";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const options = [
    { label: "Français", value: "fr" },
    { label: "English", value: "en" },
  ];
  return (
    <Select
      className="custom-react-select"
      options={options}
      value={options.find(o => o.value === i18n.language)}
      onChange={(o) => i18n.changeLanguage(o.value)}
    />
  );
}
