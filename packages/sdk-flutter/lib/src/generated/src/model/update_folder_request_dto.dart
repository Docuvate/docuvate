//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'update_folder_request_dto.g.dart';

/// UpdateFolderRequestDto
///
/// Properties:
/// * [name] 
/// * [parentId] 
/// * [mappeId] 
@BuiltValue()
abstract class UpdateFolderRequestDto implements Built<UpdateFolderRequestDto, UpdateFolderRequestDtoBuilder> {
  @BuiltValueField(wireName: r'name')
  String? get name;

  @BuiltValueField(wireName: r'parentId')
  String? get parentId;

  @BuiltValueField(wireName: r'mappeId')
  String? get mappeId;

  UpdateFolderRequestDto._();

  factory UpdateFolderRequestDto([void updates(UpdateFolderRequestDtoBuilder b)]) = _$UpdateFolderRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UpdateFolderRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UpdateFolderRequestDto> get serializer => _$UpdateFolderRequestDtoSerializer();
}

class _$UpdateFolderRequestDtoSerializer implements PrimitiveSerializer<UpdateFolderRequestDto> {
  @override
  final Iterable<Type> types = const [UpdateFolderRequestDto, _$UpdateFolderRequestDto];

  @override
  final String wireName = r'UpdateFolderRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UpdateFolderRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.name != null) {
      yield r'name';
      yield serializers.serialize(
        object.name,
        specifiedType: const FullType(String),
      );
    }
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
    UpdateFolderRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required UpdateFolderRequestDtoBuilder result,
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
  UpdateFolderRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UpdateFolderRequestDtoBuilder();
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

