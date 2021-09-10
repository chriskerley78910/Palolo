
delete from search_history;
delete from users;
ALTER TABLE users AUTO_INCREMENT = 1;


insert into users (first,last,email,hash,activated,role) values ("Chris","Kerley","chriskerley78910@gmail.com","$2y$10$aLUPtIgGGzIoZugsMeb4NOWM9/2GcwmveOHhyfuRzXcLBEQ9IoLnu",1,"admin");


insert into users (first,last,email,hash,activated,role) values ("Suprakash","Datta","teacher1@eg.com","$2y$10$aLUPtIgGGzIoZugsMeb4NOWM9/2GcwmveOHhyfuRzXcLBEQ9IoLnu",1,"teacher");
insert into users (first,last,email,hash,activated,role) values ("Jeff","Edmonds","teacher2@eg.com","$2y$10$aLUPtIgGGzIoZugsMeb4NOWM9/2GcwmveOHhyfuRzXcLBEQ9IoLnu",1,"teacher");
insert into users (first,last,email,hash,activated,role) values ("Petros","Faloutsos","teacher3@eg.com","$2y$10$aLUPtIgGGzIoZugsMeb4NOWM9/2GcwmveOHhyfuRzXcLBEQ9IoLnu",1,"teacher");
insert into users (first,last,email,hash,activated,role) values ("Andranik","Mirzaian","teacher4@eg.com","$2y$10$aLUPtIgGGzIoZugsMeb4NOWM9/2GcwmveOHhyfuRzXcLBEQ9IoLnu",1,"teacher");
insert into users (first,last,email,hash,activated,role) values ("Hamzeh","Roumani","teacher5@eg.com","$2y$10$aLUPtIgGGzIoZugsMeb4NOWM9/2GcwmveOHhyfuRzXcLBEQ9IoLnu",1,"teacher");


insert into users (first,last,email,hash,activated,role) values ("Neelam","Massey","student1@eg.com","$2y$10$aLUPtIgGGzIoZugsMeb4NOWM9/2GcwmveOHhyfuRzXcLBEQ9IoLnu",1,"student");
insert into users (first,last,email,hash,activated,role) values ("Theresa","Barnard","student2@eg.com","$2y$10$aLUPtIgGGzIoZugsMeb4NOWM9/2GcwmveOHhyfuRzXcLBEQ9IoLnu",1,"student");
insert into users (first,last,email,hash,activated,role) values ("Debbie","Ballard","student3@eg.com","$2y$10$aLUPtIgGGzIoZugsMeb4NOWM9/2GcwmveOHhyfuRzXcLBEQ9IoLnu",1,"student");
insert into users (first,last,email,hash,activated,role) values ("Kristofer","Howells","student4@eg.com","$2y$10$aLUPtIgGGzIoZugsMeb4NOWM9/2GcwmveOHhyfuRzXcLBEQ9IoLnu",1,"student");
insert into users (first,last,email,hash,activated,role) values ("Ned","Merritt","student5@eg.com","$2y$10$aLUPtIgGGzIoZugsMeb4NOWM9/2GcwmveOHhyfuRzXcLBEQ9IoLnu",1,"student");
insert into users (first,last,email,hash,activated,role) values ("Mikaeel","Oneill","student6@eg.com","$2y$10$aLUPtIgGGzIoZugsMeb4NOWM9/2GcwmveOHhyfuRzXcLBEQ9IoLnu",1,"student");
insert into users (first,last,email,hash,activated,role) values ("May","Cannon","student7@eg.com","$2y$10$aLUPtIgGGzIoZugsMeb4NOWM9/2GcwmveOHhyfuRzXcLBEQ9IoLnu",1,"student");
insert into users (first,last,email,hash,activated,role) values ("Isla","Leblanc","student8@eg.com","$2y$10$aLUPtIgGGzIoZugsMeb4NOWM9/2GcwmveOHhyfuRzXcLBEQ9IoLnu",1,"student");
insert into users (first,last,email,hash,activated,role) values ("Donte","Nixon","student9@eg.com","$2y$10$aLUPtIgGGzIoZugsMeb4NOWM9/2GcwmveOHhyfuRzXcLBEQ9IoLnu",1,"student");
insert into users (first,last,email,hash,activated,role) values ("Athena","Holt","student10@eg.com","$2y$10$aLUPtIgGGzIoZugsMeb4NOWM9/2GcwmveOHhyfuRzXcLBEQ9IoLnu",1,"student");
insert into users (first,last,email,hash,activated,role) values ("Dan","Hastings","student11@eg.com","$2y$10$aLUPtIgGGzIoZugsMeb4NOWM9/2GcwmveOHhyfuRzXcLBEQ9IoLnu",1,"student");
insert into users (first,last,email,hash,activated,role) values ("Stacie","Roberts","student12@eg.com","$2y$10$aLUPtIgGGzIoZugsMeb4NOWM9/2GcwmveOHhyfuRzXcLBEQ9IoLnu",1,"student");
insert into users (first,last,email,hash,activated,role) values ("Olli","Wicks","student13@eg.com","$2y$10$aLUPtIgGGzIoZugsMeb4NOWM9/2GcwmveOHhyfuRzXcLBEQ9IoLnu",1,"student");



/* insert a prof for the course. */
insert into course_memberships (course_id, user_id, role_id) values (24,2,1);


/* insert 10 students */
insert into course_memberships (course_id, user_id, role_id) values (24,7,2);
insert into course_memberships (course_id, user_id, role_id) values (24,8,2);
insert into course_memberships (course_id, user_id, role_id) values (24,9,2);
insert into course_memberships (course_id, user_id, role_id) values (24,10,2);
insert into course_memberships (course_id, user_id, role_id) values (24,11,2);
insert into course_memberships (course_id, user_id, role_id) values (24,12,2);
insert into course_memberships (course_id, user_id, role_id) values (24,13,2);
insert into course_memberships (course_id, user_id, role_id) values (24,14,2);
insert into course_memberships (course_id, user_id, role_id) values (24,15,2);
insert into course_memberships (course_id, user_id, role_id) values (24,16,2);

