package chat;


import java.io.IOException;
import _palolo.DB;

public class ChatDB extends DB{
	

	



	public static void startServer() throws IOException {
	
		doNode("/var/www/chat_server/src/index.js", "testing");
		
	}



	
	

	
	
}
