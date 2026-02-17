Vagrant.configure("2") do |config|
	config.vm.box = "debian/bookworm64"
	# Desactivar la carpeta compartida por defecto (/vagrant)
	config.vm.synced_folder ".", "/vagrant", disabled: true
	config.vm.hostname = "hotelgludio"

	config.vm.network "public_network", ip: "192.168.1.120", netmask: "255.255.255.0"
	config.vm.network "private_network", ip: "192.168.56.10"
	config.vm.network "forwarded_port", guest: 8080, host: 8080
	config.vm.network "forwarded_port", guest: 5173, host: 5173

	config.vm.provider "virtualbox" do |vb|
		# Aumentamos recursos para compilar assets
		vb.memory = 4096
		vb.cpus = 4
		vb.name = "HotelGludioFinal"
	end

	# Le decimos a Vagrant que suba el .env a una carpeta temporal ANTES de ejecutar el script
	config.vm.provision "file", source: ".env", destination: "/tmp/.env"

	config.vm.provision "shell", env: {
		'DB_NAME' => 'hotelgludio',
		'DB_USER' => 'hotelgludio',
		'DB_PASS' => 'hotelgludio',
		'DOMAIN'  => 'hotelgludio.es',
		'REPO'    => 'https://github.com/jadc83/GludioTFG.git'
	}, inline: <<-'SHELL'
		set -e
		export DEBIAN_FRONTEND=noninteractive

		echo ">>> 1. Instalacion de dependencias del sistema..."
		apt update -y && apt upgrade -y
		apt install -y git curl unzip gnupg2 ca-certificates openssl software-properties-common build-essential apache2 bind9 postgresql postgresql-contrib psmisc vsftpd lsb-release

		echo ">>> 2. Instalacion de Node.js 20.x..."
		curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
		apt install -y nodejs

		echo ">>> 3. Instalacion de PHP 8.4 (Sury)..."
		curl -sSLo /usr/share/keyrings/deb.sury.org-php.gpg https://packages.sury.org/php/apt.gpg
		echo "deb [signed-by=/usr/share/keyrings/deb.sury.org-php.gpg] https://packages.sury.org/php/ $(lsb_release -sc) main" > /etc/apt/sources.list.d/php.list
		apt update
		apt install -y php8.4 php8.4-cli libapache2-mod-php8.4 php8.4-pgsql php8.4-mbstring php8.4-xml php8.4-curl php8.4-gd php8.4-zip php8.4-intl php8.4-bcmath

		echo ">>> 4. Instalacion de Composer..."
		curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

		echo ">>> 5. Configuracion del servidor FTP e Usuarios..."
		sed -i 's/.*write_enable=YES.*/write_enable=YES/' /etc/vsftpd.conf || echo "write_enable=YES" >> /etc/vsftpd.conf
		sed -i 's/.*local_enable=YES.*/local_enable=YES/' /etc/vsftpd.conf || echo "local_enable=YES" >> /etc/vsftpd.conf
		systemctl restart vsftpd

		if ! id "usuario" &>/dev/null; then
			useradd -M -d /var/www/hotelgludio -s /bin/bash usuario
			echo "usuario:usuario" | chpasswd
		fi

		echo ">>> 6. Preparacion de Base de Datos PostgreSQL..."
		sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;" || true
		sudo -u postgres psql -c "DROP ROLE IF EXISTS $DB_USER;" || true
		sudo -u postgres psql -c "CREATE ROLE $DB_USER WITH LOGIN PASSWORD '$DB_PASS';"
		sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

		echo ">>> 7. Clonado del Codigo..."
		PROJECT_DIR="/var/www/hotelgludio"
		mkdir -p /var/www
		if [ ! -d "$PROJECT_DIR" ]; then
			git clone "$REPO" "$PROJECT_DIR"
		fi

		echo ">>> 7.5. Moviendo el archivo .env al proyecto..."
		if [ -f "/tmp/.env" ]; then
			mv /tmp/.env "$PROJECT_DIR/.env"
			echo "Archivo .env copiado con exito."
		else
			echo "ATENCION: No se encontro el archivo .env para copiar."
		fi

		echo ">>> 8. Permisos de carpetas (Crucial para Composer/NPM sin sudo)..."
		usermod -a -G www-data vagrant
		usermod -a -G www-data usuario
		chown -R vagrant:www-data "$PROJECT_DIR"
		chmod -R 775 "$PROJECT_DIR"

		echo ">>> 9. Creacion de Certificados SSL (HTTPS)..."
		openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
			-keyout /etc/ssl/private/hotelgludio.key \
			-out /etc/ssl/certs/hotelgludio.crt \
			-subj "/C=ES/ST=Cadiz/L=Sanlucar/O=HotelGludio/CN=$DOMAIN"

		echo ">>> 10. Configuracion de Apache y Proxy Reverb..."
		a2enmod rewrite ssl proxy proxy_wstunnel proxy_http headers

		cat > /etc/apache2/sites-available/hotelgludio.conf <<-APACHE
<VirtualHost *:80>
	ServerName $DOMAIN
	Redirect permanent / https://$DOMAIN/
</VirtualHost>

<VirtualHost *:443>
	ServerName $DOMAIN
	DocumentRoot $PROJECT_DIR/public
	SSLEngine on
	SSLCertificateFile /etc/ssl/certs/hotelgludio.crt
	SSLCertificateKeyFile /etc/ssl/private/hotelgludio.key

	<Directory $PROJECT_DIR/public>
		AllowOverride All
		Require all granted
	</Directory>

	# Bloquear acceso directo por navegador SOLO a los endpoints base de recursos
	RewriteEngine On
	RewriteCond %{REQUEST_URI} "^/(reservas|clientes|empleados|tarifas|habitaciones)/?$"
	RewriteCond %{HTTP:Accept} !application/json
	RewriteCond %{HTTP:X-Requested-With} !XMLHttpRequest
	RewriteCond %{HTTP:X-Inertia} !true
	RewriteRule ^ - [F]

	# Proxy para desviar los WebSockets a Reverb
	ProxyPreserveHost On
	ProxyPass "/app" "ws://127.0.0.1:8080/app"
	ProxyPassReverse "/app" "ws://127.0.0.1:8080/app"
</VirtualHost>
APACHE

		a2dissite 000-default
		a2ensite hotelgludio
		systemctl restart apache2

		echo ">>> 11. Configuracion de DNS Local (Bind9)..."
		cat > /etc/bind/db.hotelgludio <<-EOF
\$TTL 604800
@ IN SOA ns.$DOMAIN. root.$DOMAIN. ( 2026021501 604800 86400 2419200 604800 )
@ IN NS ns.$DOMAIN.
ns IN A 192.168.1.120
@ IN A 192.168.1.120
www IN A 192.168.1.120
EOF
		echo "zone \"$DOMAIN\" { type master; file \"/etc/bind/db.hotelgludio\"; };" > /etc/bind/named.conf.local
		systemctl restart bind9

		echo ">>> 12. Creacion del Servicio Reverb..."
		cat > /etc/systemd/system/reverb.service <<-SERVICE
[Unit]
Description=Laravel Reverb Server
After=network.target postgresql.service

[Service]
User=vagrant
Group=www-data
WorkingDirectory=$PROJECT_DIR
ExecStart=/usr/bin/php artisan reverb:start --host=0.0.0.0 --port=8080
Restart=on-failure

[Install]
WantedBy=multi-user.target
SERVICE

		systemctl daemon-reload
		systemctl enable reverb.service
		systemctl restart apache2

		echo ">>> 13. Instalacion de Stripe CLI..."
		curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | tee /usr/share/keyrings/stripe.gpg > /dev/null
		echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" > /etc/apt/sources.list.d/stripe.list
		apt update
		apt install -y stripe

		echo "-------------------------------------------------------------------"
		echo ">>> VAGRANT UP FINALIZADO SIN ERRORES"
		echo ">>> Tareas manuales pendientes por tu parte:"
		echo ">>> 1. vagrant ssh"
		echo ">>> 2. cd /var/www/hotelgludio"
		echo ">>> 3. composer install && npm install && npm run build"
		echo ">>> 4. php artisan key:generate            <-- IMPORTANTE (Seguridad)"
		echo ">>> 5. php artisan migrate:fresh --seed   <-- IMPORTANTE (Cargar BD)"
		echo ">>> 6. sudo systemctl start reverb.service"
		echo ">>> 7. stripe login (para vincular tu cuenta)"
		echo "-------------------------------------------------------------------"
	SHELL
end