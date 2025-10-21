import { ChatHeader } from './ChatHeader';
import { MessagesContainer } from './MessagesContainer';
import { MessageInput } from './MessageInput';
import { EmptyState } from './EmptyState';

export default function ChatArea({
  selectedUser,
  messages,
  messageInput,
  currentUserUsername,
  onMessageChange,
  onSendMessage
}) {
    return (
        <div className="chat-area">
            {selectedUser ? (
            <>
                <ChatHeader selectedUser={selectedUser} />
                <MessagesContainer
                messages={messages}
                currentUserUsername={currentUserUsername}
                />
                <MessageInput
                messageInput={messageInput}
                onMessageChange={onMessageChange}
                onSendMessage={onSendMessage}
                />
            </>
            ) : (
            <EmptyState />
            )}
        </div>
    )
};