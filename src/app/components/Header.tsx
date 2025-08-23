"use client";

import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "flowbite-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaYoutube } from "react-icons/fa6";
import Acknowledgment from "./Acknowledgment";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import ThemeToggle from "./ThemeToggle";

export function Header() {
  // 謝辞
  const [showAcknowledgment, setShowAcknowledgment] = useState(false);

  const [navigation, setNavigation] = useState([
    { name: "統計情報", href: "/statistics", current: false },
    {
      name: "このサイトについて",
      href: "#",
      current: false,
      onClick: () => setShowAcknowledgment(true),
    },
  ]);

  useEffect(() => {
    setNavigation(
      navigation.map((item) => ({
        ...item,
        current:
          typeof window !== "undefined" &&
          item.href === window.location.pathname
            ? true
            : false,
      }))
    );
  }, []);

  function classNames(...classes: (string | undefined)[]) {
    return classes.filter(Boolean).join(" ");
  }

  return (
    <>
      <Disclosure
        as="nav"
        className="relative bg-primary dark:bg-primary-900 text-white"
      >
        <div className="w-full px-2 sm:px-6 lg:px-4">
          <div className="relative flex h-16 items-center justify-between">
            <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
              {/* Mobile menu button*/}
              <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-300 hover:bg-white/5 hover:text-white focus:outline-2 focus:-outline-offset-1 focus:outline-indigo-500">
                <span className="absolute -inset-0.5" />
                <span className="sr-only">Open main menu</span>
                <Bars3Icon
                  aria-hidden="true"
                  className="block size-6 group-data-open:hidden"
                />
                <XMarkIcon
                  aria-hidden="true"
                  className="hidden size-6 group-data-open:block"
                />
              </DisclosureButton>
            </div>
            <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
              <div className="flex shrink-0 items-center">
                <a href="/">
                  <h1 className="text-lg lg:text-lg font-bold">
                    AZKi Song Database
                  </h1>
                </a>
              </div>
              <div className="hidden sm:ml-6 sm:block">
                <div className="flex space-x-4">
                  {navigation.map((item) => (
                    <a
                      key={`${item.name}-${item.href}`}
                      href={item.href}
                      aria-current={item.current ? "page" : undefined}
                      className={classNames(
                        item.current
                          ? "bg-primary-600 dark:bg-primary-700 text-white border-b-white"
                          : "text-white hover:bg-primary-600",
                        "rounded-md px-3 py-2 text-sm font-medium"
                      )}
                      onClick={item?.onClick || undefined}
                    >
                      {item.name}
                    </a>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
              <a
                href="https://www.youtube.com/@AZKi"
                target="_blank"
                className="hidden lg:inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-primary-100 dark:text-primary-200 bg-primary-700 hover:bg-primary-600 dark:bg-primary-900 dark:hover:bg-primary-700 focus:border-primary-700 focus:ring-primary-700 dark:focus:ring-primary-700"
              >
                <FaYoutube className="mr-1" />
                AZKi Channel
              </a>
              <ThemeToggle />
            </div>
          </div>
        </div>

        <DisclosurePanel className="sm:hidden">
          <div className="space-y-1 px-2 pt-2 pb-3">
            {navigation.map((item) => {
              if (item.onClick) {
                return (
                  <DisclosureButton
                    key={item.name}
                    className={classNames(
                      item.current
                        ? "bg-gray-900 text-white"
                        : "text-gray-300 hover:bg-white/5 hover:text-white",
                      "block rounded-md px-3 py-2 text-base font-medium w-full text-left"
                    )}
                    onClick={() => setShowAcknowledgment(true)}
                  >
                    {item.name}
                  </DisclosureButton>
                );
              } else {
                return (
                  <DisclosureButton
                    key={item.name}
                    as="a"
                    href={item.href}
                    aria-current={item.current ? "page" : undefined}
                    className={classNames(
                      item.current
                        ? "bg-primary-600 dark:bg-primary-700 text-white"
                        : "text-gray-300 hover:bg-white/5 hover:text-white",
                      "block rounded-md px-3 py-2 text-base font-medium"
                    )}
                  >
                    {item.name}
                  </DisclosureButton>
                );
              }
            })}
            <Link
              href="https://www.youtube.com/@AZKi"
              target="_blank"
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/5 hover:text-white"
            >
              AZKi Channel
            </Link>
          </div>
        </DisclosurePanel>
      </Disclosure>

      <Modal
        show={showAcknowledgment}
        onClose={() => setShowAcknowledgment(false)}
      >
        <ModalHeader className="bg-white dark:bg-gray-800 dark:text-white">
          このサイトについて
        </ModalHeader>
        <ModalBody className="bg-white dark:bg-gray-800 dark:text-white">
          <Acknowledgment />
        </ModalBody>
        <ModalFooter className="bg-white dark:bg-gray-800 dark:text-white">
          <Button
            className="bg-primary hover:bg-primary text-white transition text-sm cursor-pointer"
            onClick={() => setShowAcknowledgment(false)}
          >
            閉じる
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
