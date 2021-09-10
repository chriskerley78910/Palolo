package people_panel;

import java.io.IOException;
import _palolo.DB;

public class RelationshipDB extends DB{
	
	
	private static String path = "node /var/www/relationship_server/mock/MockRelationshipManager.js ";
	
	
	public static void doCmd(String cmd) {
		
		executeCmd(path + cmd);
	}
	
	
	public static void eraseAllRelationships() {
		
		
		doCmd("eraseAllRelationships");
	}


	public static void addStudent2ToTeacher1() {
		
		doCmd("addStudent2ToTeacher1");
		
	}


	public static void startServer() throws IOException {
	
		doNode("/var/www/relationship_server/src/index.js","testing");
		
	}



	
	

	
	
}
