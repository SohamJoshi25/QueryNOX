import { MessageSquarePlus ,MessageSquare, Bookmark, BookmarkMinusIcon, Link2Icon } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

import { SignedIn , useUser} from "@clerk/clerk-react"
import { Link } from "@tanstack/react-router";
import { useChatContext } from "@/contexts/ChatContext";
import { Separator } from "../../../components/ui/separator";
import { cn } from "@/lib/utils";
import type { ChatType } from "@/data/types";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import Toast from "@/components/ui/toast"

import useDeleteChat from "../apis/mutations/useMutationDeleteChat";
import useMutationShareChat from "../apis/mutations/useMutationShareChat";
import useQueryBookmarkedChats from "../apis/queries/useQueryBookmarkedChats";
import useMutationBookmarkChat from "../apis/mutations/useMutationBookmarkChat";
import { useMemo, useState } from "react";
import ClerkUserButton from "@/components/clerk/ClerkUserButton";
import { useSignInOverlay } from "@/hooks/useGetProOverlay";
import { useUserContext } from "@/contexts/UserContext";

export function ChatSidebar() {

  const {chats,setActiveChatIndex,activeChatIndex, setChats} = useChatContext();
  const {user} = useUser();
  const { user:userData } = useUserContext() 
  const { isMobile, setOpenMobile } = useSidebar();
  const deleteChatMutation = useDeleteChat();
  const shareChatMutation = useMutationShareChat();
  const bookmarkMutation = useMutationBookmarkChat();
  const { data: bookmarkedData } = useQueryBookmarkedChats();
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [copied, setCopied] = useState(false);
  const { openOverlay } = useSignInOverlay();
  
  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    isVisible: boolean;
  }>({
    message: '',
    type: 'success',
    isVisible: false
  });

  const bookmarkedIds = useMemo(() => new Set((bookmarkedData?.chats || []).map(c => c._id)), [bookmarkedData]);
  
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type, isVisible: true });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  // Helper function to close mobile sidebar when selecting items
  const handleMobileSidebarClose = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  // const handleShareLinkCopy = (chat: ChatType) => {
  //   const shareUrl = `${window.location.origin}/share/${chat._id}`
  //   navigator.clipboard.writeText(shareUrl)
  //   showToast('Link copied to clipboard', 'info');
  // }

  const handleShareChat = (chat: ChatType, index: number) => {
    const shareUrl = `${window.location.origin}/share/${chat._id}`
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    
    // Also set the chat as shared
    shareChatMutation.mutate({ chatId: chat._id, isShared: true }, {
      onSuccess: () => {
        setChats(prev => {
          const copy = [...prev]
          copy[index] = { ...copy[index], isShared: true }
          return copy
        })
        showToast('Chat now shareable', 'success');
      }
    })
  }

  const handleBookmarkChat = (chat: ChatType) => {
    const isBookmarked = bookmarkedIds.has(chat._id)
    setBookmarkedState(chat._id, !isBookmarked)
    
    if (isBookmarked) {
      showToast('Chat removed from bookmarks', 'success');
    } else {
      showToast('Chat added to bookmarks', 'success');
    }
  }

  // const setShareState = (chat: ChatType, index: number, isShared: boolean) => {
  //   shareChatMutation.mutate({ chatId: chat._id, isShared }, {
  //     onSuccess: () => {
  //       setChats(prev => {
  //         const copy = [...prev]
  //         copy[index] = { ...copy[index], isShared }
  //         return copy
  //       })
  //     }
  //   })
  // }

  const setBookmarkedState = (chatId: string, bookmarked: boolean) => {
    bookmarkMutation.mutate({ chatId, bookmarked })
  }

  const handleDelete = async (chat:ChatType, index:number) => {
    const isBookmarked = bookmarkedIds.has(chat._id)
    if (isBookmarked) {
      setBookmarkedState(chat._id, false)
    }
    deleteChatMutation.mutate({chatId:chat._id});
    setChats((prev)=>{
      const _chats = prev.filter(pchat => pchat._id != chat._id);
      return [..._chats];
    })
    if(activeChatIndex==index){
      setActiveChatIndex(-1);
    }else if(activeChatIndex > index){
      setActiveChatIndex(prev => prev-1);
    }
    showToast('Chat deleted', 'success');
  }
  
  return (
    <>
      <Sidebar collapsible="icon" className="">

        <SidebarHeader className="pt-4 mb-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex justify-between h-max">
                <h2 className="group-data-[state=collapsed]:hidden group-data-[state=expanded]:text-2xl transition-all ml-2">Chats</h2>
                <SidebarTrigger className="h-8 ml-[2px] scale-125"/>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        
        <SidebarContent >

          <SidebarGroup className="my-0 transition-all duration-100">
            <SidebarGroupContent>
              <SidebarMenu>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild className={cn("my-[0.7px]",activeChatIndex < 0 ? "bg-accent/30" : "" )}>
                      <Link to={`/chat`} onClick={() => {
                        setActiveChatIndex(-1);
                        handleMobileSidebarClose();
                      }}>
                        <MessageSquarePlus/>
                        <span>New Chat</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => setShowBookmarks(prev => !prev)}
                      tooltip={showBookmarks ? 'Hide Bookmarks' : 'Bookmarks'}
                      className={cn("my-[0.7px]")}
                    >
                      {showBookmarks ? <BookmarkMinusIcon size={"18px"}/> : <Bookmark size={"18px"}/>}
                      <span>{showBookmarks ? 'Hide Bookmarks' : 'Bookmarks'}</span>
                    </SidebarMenuButton>
                    {showBookmarks && (
                      <SidebarMenu className="ml-3 mt-1 flex flex-col gap-1 transition-all duration-300 w-[calc(100%)-20px] group-data-[state=collapsed]:hidden">
                        {(bookmarkedData?.chats || []).map((b) => (
                          <SidebarMenuItem key={b._id} >
                            <SidebarMenuButton asChild >
                              <Link
                                to={`/chat/$chatId`}
                                params={{ chatId: b._id }}
                                onClick={() => {
                                  const idx = chats.findIndex(c => c._id === b._id);
                                  setActiveChatIndex(idx);
                                  handleMobileSidebarClose();
                                }}
                                className="flex items-center gap-2"
                              >
                                <Link2Icon size={"18px"} />
                                <span
                                  className="truncate w-full inline-block transition-all duration-300"
                                  title={b.title}
                                >
                                  {b.title}
                                </span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    )}
                  </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {chats.length > 0 && <SidebarGroup className="mt-0 py-0 overflow-hidden group-data-[state=expanded]:pr-0 group-data-[state=collapsed]:hidden">
            <SidebarGroupLabel className="group-data-[state=collapsed]:hidden">Previous Chats</SidebarGroupLabel>
            <SidebarGroupContent className="h-full overflow-auto group-data-[state=collapsed]:overflow-clip ml-0 thin-scrollbar pr-2.5">
              <SidebarMenu>
                {chats.map((chat,index)=>
                  <SidebarMenuItem key = {index+chat._id}>
                    <SidebarMenuButton asChild className={cn("my-[0.7px]",index == activeChatIndex ? "bg-accent/40" : "" )}>
                      <div className="flex justify-start items-center group/messages gap-0">
                        <Link to={`/chat/$chatId`} params={{chatId:chat._id}} onClick={() => {
                          setActiveChatIndex(index);
                          handleMobileSidebarClose();
                        }} className="flex justify-start items-center gap-2 transition-all duration-300">
                          <MessageSquare size={"18px"}/>
                          <span className="truncate w-[196px] group-hover/messages:w-[163px] inline-block transition-all duration-300" title={chat.title}>{chat.title}</span>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <svg viewBox="0 0 40 20" className=" group-hover/messages:block justify-center items-center opacity-60 duration-300 fill-accent-foreground hover:opacity-100 cursor-pointer" onClick={()=>{}}>
                                <circle cx="5" cy="10" r="5"/>
                                <circle cx="20" cy="10" r="5" />
                                <circle cx="35" cy="10" r="5" />
                              </svg>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="min-[600px]:w-56 w-48" align="start" side="right">
                            <DropdownMenuLabel>Chat Options</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                              <DropdownMenuItem className="min-[600px]:py-2 py-0" onSelect={(e) => e.preventDefault()}>
                                <AlertDialog>
                                  <AlertDialogTrigger className="w-full text-start">Share Chat</AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Share this chat</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to share this chat? This will make it publicly accessible via the link below.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <div className="flex items-center space-x-2">
                                      <Input
                                        value={`${window.location.origin}/share/${chat._id}`}
                                        readOnly
                                        className="w-auto min-w-[300px] max-w-[400px]"
                                      />
                                      <Button
                                        size="sm"
                                        onClick={() => {
                                          navigator.clipboard.writeText(`${window.location.origin}/share/${chat._id}`)
                                          setCopied(true)
                                          setTimeout(() => setCopied(false), 2000)
                                          showToast('Link copied to clipboard', 'info');
                                        }}
                                        className="shrink-0"
                                      >
                                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                      </Button>
                                    </div>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleShareChat(chat, index)} className="hover:bg-green-100 dark:hover:bg-green-900/40 hover:text-green-600 dark:hover:text-green-400">
                                        Share!
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuItem>
                              <DropdownMenuItem  className="min-[600px]:py-2 py-0" onSelect={(e) => e.preventDefault()}>
                                <AlertDialog>
                                  <AlertDialogTrigger className="w-full text-start">
                                    {bookmarkedIds.has(chat._id) ? 'Remove Bookmark' : 'Bookmark'}
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        {bookmarkedIds.has(chat._id) ? 'Remove Bookmark' : 'Bookmark this chat'}
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        {bookmarkedIds.has(chat._id) 
                                          ? 'Are you sure you want to remove this chat from your bookmarks?'
                                          : 'Are you sure you want to bookmark this chat? It will be saved to your bookmarks for easy access.'
                                        }
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleBookmarkChat(chat)} className="hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-600 dark:hover:text-blue-400">
                                        {bookmarkedIds.has(chat._id) ? 'Remove!' : 'Bookmark!'}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem  className="min-[600px]:py-2 py-0" variant="destructive" onSelect={(e) => e.preventDefault()}>
                              <AlertDialog>
                                <AlertDialogTrigger className="w-full text-start">Delete Chat</AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete your chat and all conversations.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={()=>handleDelete(chat,index)} className="hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-600 dark:hover:text-red-400">Delete!</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )} 

              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>}

        </SidebarContent>
        
        <Separator/>

        <SidebarFooter className="pb-4 overflow-x-hidden">
            <div className="flex flex-1 overflow-auto justify-left items-center gap-2 overflow-x-hidden pt-1 pl-[2px]">
              <SignedIn>
                  <ClerkUserButton />
                  <span className="text-nowrap ml-2">{user?.fullName}</span>
                  {!userData?.isPro && <div className="ml-auto my-auto border-[1px] dark:border-white border-black rounded-xl px-2 pt-[1px] mt-1.5 pb-[3px] text-xs cursor-pointer opacity-55 
                  hover:opacity-85 hover:border  hover:border-t-purple-600 transition-all duration-200 ease-in-out hover:border-b-pink-600
                    hover:border-l-purple-500 hover:border-r-pink-500 " onClick={() => {openOverlay()}}>Go Pro</div>}
              </SignedIn>
            </div>
        </SidebarFooter>
      </Sidebar>

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </>
  )
}