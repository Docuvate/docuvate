//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'sftp_ingress_create_account_body_dto.g.dart';

/// SftpIngressCreateAccountBodyDto
///
/// Properties:
/// * [displayName] 
/// * [username] 
/// * [passwordPlain] 
/// * [sshPublicKey] 
/// * [folderId] 
/// * [labelIds] 
/// * [mapSubfolders] 
@BuiltValue()
abstract class SftpIngressCreateAccountBodyDto implements Built<SftpIngressCreateAccountBodyDto, SftpIngressCreateAccountBodyDtoBuilder> {
  @BuiltValueField(wireName: r'displayName')
  String get displayName;

  @BuiltValueField(wireName: r'username')
  String? get username;

  @BuiltValueField(wireName: r'passwordPlain')
  String? get passwordPlain;

  @BuiltValueField(wireName: r'sshPublicKey')
  String? get sshPublicKey;

  @BuiltValueField(wireName: r'folderId')
  String? get folderId;

  @BuiltValueField(wireName: r'labelIds')
  BuiltList<String>? get labelIds;

  @BuiltValueField(wireName: r'mapSubfolders')
  bool? get mapSubfolders;

  SftpIngressCreateAccountBodyDto._();

  factory SftpIngressCreateAccountBodyDto([void updates(SftpIngressCreateAccountBodyDtoBuilder b)]) = _$SftpIngressCreateAccountBodyDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SftpIngressCreateAccountBodyDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SftpIngressCreateAccountBodyDto> get serializer => _$SftpIngressCreateAccountBodyDtoSerializer();
}

class _$SftpIngressCreateAccountBodyDtoSerializer implements PrimitiveSerializer<SftpIngressCreateAccountBodyDto> {
  @override
  final Iterable<Type> types = const [SftpIngressCreateAccountBodyDto, _$SftpIngressCreateAccountBodyDto];

  @override
  final String wireName = r'SftpIngressCreateAccountBodyDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SftpIngressCreateAccountBodyDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'displayName';
    yield serializers.serialize(
      object.displayName,
      specifiedType: const FullType(String),
    );
    if (object.username != null) {
      yield r'username';
      yield serializers.serialize(
        object.username,
        specifiedType: const FullType(String),
      );
    }
    if (object.passwordPlain != null) {
      yield r'passwordPlain';
      yield serializers.serialize(
        object.passwordPlain,
        specifiedType: const FullType(String),
      );
    }
    if (object.sshPublicKey != null) {
      yield r'sshPublicKey';
      yield serializers.serialize(
        object.sshPublicKey,
        specifiedType: const FullType(String),
      );
    }
    if (object.folderId != null) {
      yield r'folderId';
      yield serializers.serialize(
        object.folderId,
        specifiedType: const FullType(String),
      );
    }
    if (object.labelIds != null) {
      yield r'labelIds';
      yield serializers.serialize(
        object.labelIds,
        specifiedType: const FullType(BuiltList, [FullType(String)]),
      );
    }
    if (object.mapSubfolders != null) {
      yield r'mapSubfolders';
      yield serializers.serialize(
        object.mapSubfolders,
        specifiedType: const FullType(bool),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    SftpIngressCreateAccountBodyDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SftpIngressCreateAccountBodyDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'displayName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.displayName = valueDes;
          break;
        case r'username':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.username = valueDes;
          break;
        case r'passwordPlain':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.passwordPlain = valueDes;
          break;
        case r'sshPublicKey':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.sshPublicKey = valueDes;
          break;
        case r'folderId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.folderId = valueDes;
          break;
        case r'labelIds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.labelIds.replace(valueDes);
          break;
        case r'mapSubfolders':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.mapSubfolders = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SftpIngressCreateAccountBodyDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SftpIngressCreateAccountBodyDtoBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}

