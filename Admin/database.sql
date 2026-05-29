create database chuachinhphuoc
go
use chuachinhphuoc
go

create table Admin (
	users		varchar(100) primary key,
	email		varchar(100),
	passwords	varchar(500)
)

insert into Admin (users, email, passwords) values ('trminhdev', 'trminhlaptrinhvien@gmail.com', 'Tranducminh@2007')

select * from Admin