//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'create_folder_request_dto.g.dart';

/// CreateFolderRequestDto
///
/// Properties:
/// * [name] 
/// * [parentId] 
/// * [mappeId] 
@BuiltValue()
abstract class CreateFolderRequestDto implements Built<CreateFolderRequestDto, CreateFolderRequestDtoBuilder> {
  @BuiltValueField(wireName: r'name')
  String get name;

  @BuiltValueField(wireName: r'parentId')
  String? get parentId;

  @BuiltValueField(wireName: r'mappeId')
  String? get mappeId;

  CreateFolderRequestDto._();

  factory CreateFolderRequestDto([void updates(CreateFolderRequestDtoBuilder b)]) = _$CreateFolderRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CreateFolderRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CreateFolderRequestDto> get serializer => _$CreateFolderRequestDtoSerializer();
}

class _$CreateFolderRequestDtoSerializer implements PrimitiveSerializer<CreateFolderRequestDto> {
  @override
  final Iterable<Type> types = const [CreateFolderRequestDto, _$CreateFolderRequestDto];

  @override
  final String wireName = r'CreateFolderRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CreateFolderRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'name';
    yield serializers.serialize(
      object.name,
      specifiedType: const FullType(String),
    );
    if (object.parentId != null) {
      yield r'parentId';
      yield serializers.serialize(
        object.parentId,
        specifiedType: const FullType(String),
      );
    }
    if (object.mappeId != null) {
      yield r'mappeId';
      yield serializers.serialize(
        object.mappeId,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    CreateFolderRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required CreateFolderRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'name':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.name = valueDes;
          break;
        case r'parentId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.parentId = valueDes;
          break;
        case r'mappeId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.mappeId = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CreateFolderRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CreateFolderRequestDtoBuilder();
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

