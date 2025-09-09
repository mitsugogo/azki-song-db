"use client";

import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "flowbite-react";
import Link from "next/link";
import { useEffect, useState, useMemo, useRef } from "react";
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
  const [showAcknowledgment, setShowAcknowledgment] = useState(false);
  const [currentPath, setCurrentPath] = useState("");
  const disclosureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentPath(window.location.pathname);
    }
  }, []);

  const isTopPage = useMemo(() => currentPath === "/", [currentPath]);

  const baseNavigation = [
    { name: "Discography", href: "/discography" },
    { name: "統計情報", href: "/statistics" },
  ];

  const navigation = useMemo(() => {
    const navItems = baseNavigation.map((item) => ({
      ...item,
      current: item.href !== "#" && item.href === currentPath,
    }));

    if (!isTopPage) {
      navItems.unshift({
        name: "TOP",
        href: "/",
        current: false,
      });
    }

    return navItems;
  }, [currentPath, isTopPage]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleRouteChange = () => {
        setCurrentPath(window.location.pathname);
      };
      window.addEventListener("popstate", handleRouteChange);
      window.addEventListener("pushstate", handleRouteChange);
      return () => {
        window.removeEventListener("popstate", handleRouteChange);
        window.removeEventListener("pushstate", handleRouteChange);
      };
    }
  }, []);

  function classNames(
    ...classes: (string | boolean | undefined | null)[]
  ): string {
    return classes.filter(Boolean).join(" ");
  }

  return (
    <>
      <Disclosure
        as="nav"
        className="relative bg-primary dark:bg-primary-900 text-white"
        ref={disclosureRef}
      >
        {({ open, close }) => {
          useEffect(() => {
            const handleOutsideClick = (event: MouseEvent) => {
              if (
                disclosureRef.current &&
                !disclosureRef.current.contains(event.target as Node)
              ) {
                close();
              }
            };
            if (open) {
              document.addEventListener("mousedown", handleOutsideClick);
            }
            return () => {
              document.removeEventListener("mousedown", handleOutsideClick);
            };
          }, [open, close]);

          return (
            <>
              <div className="w-full px-2">
                <div className="relative flex h-12 md:h-16 items-center">
                  <div className="absolute inset-y-0 left-0 flex items-center z-10">
                    <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-300 hover:bg-white/5 hover:text-white focus:outline-2 focus:-outline-offset-1 focus:outline-indigo-500 cursor-pointer">
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
                  <div className="flex flex-1 items-center justify-center sm:justify-start sm:ml-12">
                    <div className="flex shrink-0 items-center lg:ml-2">
                      <a href="/">
                        <h1 className="text-lg lg:text-lg font-bold">
                          AZKi Song Database
                        </h1>
                      </a>
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

              <DisclosurePanel
                as="div"
                className="fixed inset-y-0 left-0 z-50 w-3/4 max-w-xs overflow-y-auto bg-primary dark:bg-primary-900 px-6 py-4 shadow-lg ring-1 ring-gray-900/10 transition-transform duration-500 ease-in-out group-data-[closed]:-translate-x-full"
              >
                <div className="space-y-1">
                  <div className="flex justify-start">
                    <Button
                      onClick={(event) => {
                        event.currentTarget.blur();
                        close();
                      }}
                      className="rounded-md p-2 text-gray-300 hover:bg-white/5 hover:text-white"
                    >
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </Button>
                  </div>

                  {navigation.map((item) => {
                    const isCurrent = item.current;
                    const baseClasses =
                      "block rounded-md px-3 py-2 text-base font-medium";
                    const activeClasses =
                      "bg-primary-600 dark:bg-primary-700 text-white";
                    const inactiveClasses =
                      "text-gray-300 hover:bg-white/5 hover:text-white";

                    return (
                      <DisclosureButton
                        key={item.name}
                        as="a"
                        href={item.href}
                        aria-current={isCurrent ? "page" : undefined}
                        className={classNames(
                          isCurrent ? activeClasses : inactiveClasses,
                          baseClasses
                        )}
                        onClick={() => close()}
                      >
                        {item.name}
                      </DisclosureButton>
                    );
                  })}

                  <DisclosureButton
                    key="about"
                    className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/5 hover:text-white cursor-pointer"
                    onClick={() => {
                      setShowAcknowledgment(true);
                      close();
                    }}
                  >
                    このサイトについて
                  </DisclosureButton>
                  <Link
                    href="https://www.youtube.com/@AZKi"
                    target="_blank"
                    className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/5 hover:text-white"
                    onClick={() => close()}
                  >
                    AZKi Channel
                  </Link>
                </div>
              </DisclosurePanel>
            </>
          );
        }}
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
            閉じる
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
