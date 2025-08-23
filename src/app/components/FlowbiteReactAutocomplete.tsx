import * as React from "react";
import useAutocomplete from "@mui/material/useAutocomplete";
import {
  TextInput,
  ListGroup,
  ListGroupItem,
  ListGroupItemProps,
} from "flowbite-react";
import { IconType } from "react-icons/lib";

interface FrowbiteReactAutocompleteProps {
  options: string[];
  onSelect: (value: string) => void;
  inputProps: {
    icon?: IconType;
    placeholder?: string;
  };
}

export default function FlowbiteReactAutocomplete({
  options,
  onSelect,
  inputProps,
}: FrowbiteReactAutocompleteProps) {
  const [inputValue, setInputValue] = React.useState("");

  const {
    getRootProps,
    getInputProps,
    getListboxProps,
    getOptionProps,
    groupedOptions,
  } = useAutocomplete({
    options: options,
    inputValue: inputValue,
    onInputChange: (event, newInputValue) => {
      setInputValue(newInputValue);
      onSelect(newInputValue);
    },
  });

  return (
    <div className="relative" {...getRootProps()}>
      {/* 入力フィールド */}
      <TextInput
        {...getInputProps()}
        icon={inputProps?.icon}
        placeholder={inputProps?.placeholder}
      />

      {/* ドロップダウンメニュー */}
      {groupedOptions.length > 0 && (
        <ListGroup
          {...getListboxProps()}
          className="absolute z-10 w-full mt-1 border-none rounded-lg shadow-lg h-64 overflow-y-auto"
        >
          {groupedOptions.map((option, index) => {
            const optionProps = getOptionProps({ option, index });
            return (
              <ListGroupItem
                {...(optionProps as Omit<ListGroupItemProps, "ref">)}
                key={optionProps.key}
                className="cursor-pointer"
              >
                {option}
              </ListGroupItem>
            );
          })}
        </ListGroup>
      )}

      {/* ボタン */}
      {/* {inputValue && (
        <button
          className="absolute top-1/2 transform -translate-y-1/2 p-1 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700"
          onClick={(e) => {
            setInputValue('');
          }}
          style={{ right: 'calc(var(--spacing) * 12)' }}
        >
          <HiX className="w-4 h-4" />
        </button>
      )} */}
      {/* <button
        className="absolute top-0 end-0 p-2.5 h-full text-sm font-medium text-white bg-primary-700 rounded-e-lg border border-primary-700 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
        onClick={() => {
          // setInputValue('');
          onSelect(inputValue);
        }}
      >
        <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
        </svg>
      </button> */}
    </div>
  );
}
